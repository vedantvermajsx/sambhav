const asyncHandler = require("express-async-handler");

/**
 * Only the user who created the document (its `createdBy`) gets through.
 * On success the loaded document is on req.resource, so the next handler
 * doesn't have to query for it again.
 */
function restrictToOwner(Model, ownerField = "createdBy") {
  return asyncHandler(async (req, res, next) => {
    const doc = await Model.findOne({ id: req.params.id });
    if (!doc) {
      res.status(404);
      throw new Error(`${Model.modelName} not found`);
    }
    if (doc[ownerField] !== req.user.id) {
      res.status(403);
      throw new Error("Forbidden: you don't own this resource");
    }
    req.resource = doc;
    next();
  });
}

/**
 * Only members of the team that owns the workspace get through. On success
 * req.resource is the workspace and req.team its team.
 */
function restrictToTeamMember(Workspace, Team) {
  return asyncHandler(async (req, res, next) => {
    const workspace = await Workspace.findOne({ id: req.params.id });
    if (!workspace) {
      res.status(404);
      throw new Error("Workspace not found");
    }
    const team = await Team.findOne({ id: workspace.teamId });
    if (!team || !team.members.some((m) => m.userId === req.user.id)) {
      res.status(403);
      throw new Error("Forbidden: you're not a member of this workspace's team");
    }
    req.resource = workspace;
    req.team = team;
    next();
  });
}

module.exports = { restrictToOwner, restrictToTeamMember };
