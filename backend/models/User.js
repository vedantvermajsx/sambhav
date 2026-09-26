const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { cloudinaryUrlValidator } = require("../config/cloudinary");

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    // For industry accounts this is the company name.
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "researcher", "industry"], required: true },
    // Reward points earned by solving problems (students only).
    points: { type: Number, default: 0, min: 0 },
    initials: { type: String },
    avatarUrl: { type: String, validate: cloudinaryUrlValidator },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
