const asyncHandler = require("express-async-handler");
const Problem = require("../models/Problem");
const Category = require("../models/Category");
const Team = require("../models/Team");
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const readController = require("./readController");
const genId = require("../utils/genId");
const { splitPoints } = require("../utils/rewards");

const MAX_REWARD_POINTS = 1_000_000;

const { getAll, getOne } = readController(Problem, {
  filterableFields: ["categoryId", "status", "createdBy"],
});

// POST /api/problems   (industry only)
const create = asyncHandler(async (req, res) => {
  const {
    title,
    categoryId,
    description,
    location,
    customFieldValues,
    dataAttachments,
    proofAttachments,
  } = req.body;
  const rewardPoints = req.body.rewardPoints ?? 0;

  if (![title, categoryId, description, location].every((v) => typeof v === "string" && v.trim())) {
    res.status(400);
    throw new Error("title, categoryId, description and location are required");
  }
  if (!Number.isInteger(rewardPoints) || rewardPoints < 0 || rewardPoints > MAX_REWARD_POINTS) {
    res.status(400);
    throw new Error(`rewardPoints must be a whole number between 0 and ${MAX_REWARD_POINTS}`);
  }
  if (!(await Category.exists({ id: categoryId }))) {
    res.status(400);
    throw new Error("Unknown category");
  }

  // Only the fields below can be set by the client — status, rewards and the
  // owner are always decided by the server.
  const problem = await Problem.create({
    id: genId("prob"),
    title,
    categoryId,
    description,
    location,
    rewardPoints,
    customFieldValues: customFieldValues && typeof customFieldValues === "object" ? customFieldValues : {},
    dataAttachments: Array.isArray(dataAttachments) ? dataAttachments : [],
    proofAttachments: Array.isArray(proofAttachments) ? proofAttachments : [],
    createdBy: req.user.id,
  });
  res.status(201).json(problem);
});

// POST /api/problems/:id/join   (student or researcher)
// Adds the caller to the problem's team, creating the team + workspace the
// first time anyone joins. Safe to call twice.
const join = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ id: req.params.id });
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }
  if (problem.status === "completed") {
    res.status(409);
    throw new Error("This problem is already solved");
  }

  let team = await Team.findOne({ problemId: problem.id });
  if (!team) {
    const teamId = genId("team");
    const workspaceId = genId("ws");
    // Workspace first, so a team never exists without one.
    await Workspace.create({ id: workspaceId, teamId });
    try {
      team = await Team.create({
        id: teamId,
        problemId: problem.id,
        workspaceId,
        createdBy: req.user.id,
      });
    } catch (err) {
      // Someone else created the team a moment ago (unique problemId): use theirs.
      await Workspace.deleteOne({ id: workspaceId });
      if (err.code !== 11000) throw err;
      team = await Team.findOne({ problemId: problem.id });
    }
  }

  // The filter makes this a no-op if the user is already on the team.
  await Team.updateOne(
    { id: team.id, "members.userId": { $ne: req.user.id } },
    { $push: { members: { userId: req.user.id, role: req.user.role } } }
  );

  await Problem.updateOne({ id: problem.id, status: "open" }, { status: "in-progress" });

  const [freshProblem, freshTeam, workspace] = await Promise.all([
    Problem.findOne({ id: problem.id }),
    Team.findOne({ id: team.id }),
    Workspace.findOne({ id: team.workspaceId }),
  ]);
  res.json({ problem: freshProblem, team: freshTeam, workspace });
});

// POST /api/problems/:id/complete   (the industry account that posted it)
// Marks the problem solved and shares its reward points equally between the
// student members of the team.
const complete = asyncHandler(async (req, res) => {
  const problem = req.resource; // loaded by restrictToOwner
  if (problem.status === "completed") {
    res.status(409);
    throw new Error("This problem is already marked as solved");
  }

  const team = await Team.findOne({ problemId: problem.id });
  if (problem.status !== "in-progress" || !team || team.members.length === 0) {
    res.status(400);
    throw new Error("Nobody has started working on this problem yet");
  }

  const studentIds = team.members.filter((m) => m.role === "student").map((m) => m.userId);
  const rewards = splitPoints(problem.rewardPoints, studentIds);

  // Only one request can flip in-progress -> completed, so points are never
  // paid out twice even if the button is clicked repeatedly.
  const solved = await Problem.findOneAndUpdate(
    { id: problem.id, status: "in-progress" },
    { status: "completed", completedAt: new Date(), rewards },
    { new: true }
  );
  if (!solved) {
    res.status(409);
    throw new Error("This problem is already marked as solved");
  }

  if (rewards.length > 0) {
    await User.bulkWrite(
      rewards.map((r) => ({
        updateOne: { filter: { id: r.userId }, update: { $inc: { points: r.points } } },
      }))
    );
  }

  res.json(solved);
});

module.exports = { getAll, getOne, create, join, complete };
