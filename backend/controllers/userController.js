const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const readController = require("./readController");
const { isCloudinaryUrl } = require("../config/cloudinary");
const toProfile = require("../utils/toProfile");

// Public directory of people. Emails and password hashes are never exposed
// here — a user only sees their own email, via GET /api/auth/me.
const PUBLIC_FIELDS = "id name role points initials avatarUrl createdAt";

const { getAll, getOne } = readController(User, {
  filterableFields: ["role"],
  select: PUBLIC_FIELDS,
});

// PATCH /api/users/me/avatar  { avatarUrl }
// Only ever touches the signed-in user's own avatar, and only accepts URLs
// from this project's Cloudinary cloud.
const updateMyAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;
  if (!isCloudinaryUrl(avatarUrl)) {
    res.status(400);
    throw new Error("avatarUrl must be a Cloudinary URL from this project's cloud");
  }
  await User.updateOne({ id: req.user.id }, { avatarUrl });
  const user = await User.findOne({ id: req.user.id });
  res.json(toProfile(user));
});

module.exports = { getAll, getOne, updateMyAvatar };
