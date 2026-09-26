const mongoose = require("mongoose");

const TeamMemberSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ["student", "researcher"], required: true },
  },
  { _id: false }
);

// One team per problem. Created the first time someone joins the problem.
const TeamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    problemId: { type: String, required: true, unique: true },
    members: [TeamMemberSchema],
    workspaceId: { type: String, required: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
