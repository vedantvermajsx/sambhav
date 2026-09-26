const express = require("express");
const { signUpload } = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/sign", protect, signUpload);

module.exports = router;
