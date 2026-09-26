const asyncHandler = require("express-async-handler");
const Workspace = require("../models/Workspace");
const readController = require("./readController");
const { isCloudinaryUrl } = require("../config/cloudinary");

const { getAll, getOne } = readController(Workspace, { filterableFields: ["teamId"] });

const addTask = asyncHandler(async (req, res) => {
  const { title, status } = req.body;
  const assignee = req.body.assignee || req.user.id;
  if (typeof title !== "string" || !title.trim()) {
    res.status(400);
    throw new Error("title is required");
  }
  if (!req.team.members.some((m) => m.userId === assignee)) {
    res.status(400);
    throw new Error("assignee must be a member of the team");
  }
  const ws = await Workspace.findOneAndUpdate(
    { id: req.params.id },
    { $push: { tasks: { title: title.trim(), status: status || "todo", assignee } } },
    { new: true, runValidators: true }
  );
  res.status(201).json(ws);
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const idx = Number(req.params.taskIndex);
  const allowed = ["todo", "in-progress", "done"];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of ${allowed.join(", ")}`);
  }
  const ws = req.resource; // loaded by restrictToTeamMember
  if (!ws.tasks[idx]) {
    res.status(404);
    throw new Error("Task not found at that index");
  }
  ws.tasks[idx].status = status;
  await ws.save();
  res.json(ws);
});

// The author is always the signed-in user, never something the client sends.
const addUpdate = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (typeof text !== "string" || !text.trim()) {
    res.status(400);
    throw new Error("text is required");
  }
  const ws = await Workspace.findOneAndUpdate(
    { id: req.params.id },
    { $push: { updates: { author: req.user.id, text: text.trim(), at: new Date().toISOString() } } },
    { new: true }
  );
  res.status(201).json(ws);
});

const addDoc = asyncHandler(async (req, res) => {
  const { name, type, url } = req.body;
  if (!name || !type) {
    res.status(400);
    throw new Error("name and type are required");
  }
  if (url && !isCloudinaryUrl(url)) {
    res.status(400);
    throw new Error("url must be a Cloudinary URL from this project's cloud");
  }
  const ws = await Workspace.findOneAndUpdate(
    { id: req.params.id },
    { $push: { sharedDocs: { name, type, ...(url && { url }) } } },
    { new: true }
  );
  res.status(201).json(ws);
});

module.exports = { getAll, getOne, addTask, updateTaskStatus, addUpdate, addDoc };
