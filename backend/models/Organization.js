const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["municipal", "private", "NGO", "academic"], required: true },
    verificationStatus: { type: String, enum: ["verified", "pending"], default: "pending" },
    createdBy: { type: String }, // User.id of whoever registered this org
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
