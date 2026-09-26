const mongoose = require("mongoose");
const { cloudinaryUrlValidator } = require("../config/cloudinary");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    assignee: { type: String, required: true },
  },
  { _id: false }
);

const SharedDocSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    url: { type: String, validate: cloudinaryUrlValidator },
  },
  { _id: false }
);

const UpdateSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    text: { type: String, required: true },
    at: { type: String, required: true },
  },
  { _id: false }
);

const WorkspaceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    teamId: { type: String, required: true },
    tasks: [TaskSchema],
    sharedDocs: [SharedDocSchema],
    updates: [UpdateSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", WorkspaceSchema);
