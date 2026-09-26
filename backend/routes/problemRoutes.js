const express = require("express");
const ctrl = require("../controllers/problemController");
const { protect, restrictTo } = require("../middleware/auth");
const { restrictToOwner } = require("../middleware/ownership");
const Problem = require("../models/Problem");

const router = express.Router();

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
// Only industry accounts can post problems.
router.post("/", protect, restrictTo("industry"), ctrl.create);
router.post("/:id/join", protect, restrictTo("student", "researcher"), ctrl.join);
router.post(
  "/:id/complete",
  protect,
  restrictTo("industry"),
  restrictToOwner(Problem),
  ctrl.complete
);

module.exports = router;
