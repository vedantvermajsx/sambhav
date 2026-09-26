const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const genId = require("../utils/genId");
const toProfile = require("../utils/toProfile");

// Roles a person can sign up as.
const ROLES = ["student", "researcher", "industry"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function initialsOf(name) {
  const words = name.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 2);
  return letters.toUpperCase();
}

// POST /api/auth/register  { name, email, password, role }
const register = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("name, email, password and role are required");
  }
  if (!ROLES.includes(role)) {
    res.status(400);
    throw new Error(`role must be one of: ${ROLES.join(", ")}`);
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400);
    throw new Error("Enter a valid email address");
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    res.status(400);
    throw new Error(`Password must be at least ${MIN_PASSWORD} characters`);
  }

  // The unique index on `email` is what really guarantees one account per
  // email; this check just gives a friendly error in the common case.
  if (await User.exists({ email })) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    id: genId("user"),
    name,
    email,
    password,
    role,
    initials: initialsOf(name),
  });

  res.status(201).json({ token: generateToken(user.id), user: toProfile(user) });
});

// POST /api/auth/login  { email, password }
const login = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password } = req.body;
  if (!email || typeof password !== "string" || !password) {
    res.status(400);
    throw new Error("email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({ token: generateToken(user.id), user: toProfile(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json(toProfile(req.user));
});

module.exports = { register, login, me };
