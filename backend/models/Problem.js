const mongoose = require("mongoose");
const { cloudinaryUrlValidator } = require("../config/cloudinary");

const AttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: String, required: true },
    url: { type: String, validate: cloudinaryUrlValidator },
  },
  { _id: false }
);

const RewardSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    points: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ProblemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    categoryId: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    // User.id of the industry account that posted this problem.
    createdBy: { type: String, required: true },
    customFieldValues: { type: mongoose.Schema.Types.Mixed, default: {} },
    dataAttachments: [AttachmentSchema],
    proofAttachments: [AttachmentSchema],
    // Points offered by the industry. Shared equally between the student team
    // members when the problem is marked solved.
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: "rewardPoints must be a whole number" },
    },
    status: {
      type: String,
      enum: ["open", "team-forming", "in-progress", "piloting", "completed"],
      default: "open",
    },
    // Filled in once, when the problem is marked solved.
    rewards: [RewardSchema],
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", ProblemSchema);
