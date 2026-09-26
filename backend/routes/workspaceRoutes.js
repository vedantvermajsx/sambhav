const express = require("express");
const ctrl = require("../controllers/workspaceController");
const { protect } = require("../middleware/auth");
const { restrictToTeamMember } = require("../middleware/ownership");
const Workspace = require("../models/Workspace");
const Team = require("../models/Team");

const router = express.Router();
const teamMemberOnly = restrictToTeamMember(Workspace, Team);

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/:id/tasks", protect, teamMemberOnly, ctrl.addTask);
router.patch("/:id/tasks/:taskIndex", protect, teamMemberOnly, ctrl.updateTaskStatus);
router.post("/:id/updates", protect, teamMemberOnly, ctrl.addUpdate);
router.post("/:id/docs", protect, teamMemberOnly, ctrl.addDoc);

module.exports = router;
