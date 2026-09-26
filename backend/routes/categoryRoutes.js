const express = require("express");
const Category = require("../models/Category");
const readController = require("../controllers/readController");

const router = express.Router();
const ctrl = readController(Category);

// Categories are managed by seeding (npm run seed), so the API is read-only.
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);

module.exports = router;
