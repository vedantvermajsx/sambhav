const express = require("express");
const ctrl = require("../controllers/teamController");

const router = express.Router();

// Teams are created and joined through POST /api/problems/:id/join.
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);

module.exports = router;
