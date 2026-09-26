const express = require("express");
const ctrl = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", ctrl.getAll);
router.patch("/me/avatar", protect, ctrl.updateMyAvatar);
router.get("/:id", ctrl.getOne);

module.exports = router;
