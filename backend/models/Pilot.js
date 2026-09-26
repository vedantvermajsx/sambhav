const mongoose = require("mongoose");

const KpiSeriesSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const KPISchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    target: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    unit: { type: String },
    series: [KpiSeriesSchema],
  },
  { _id: false }
);

const PilotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    problemId: { type: String, required: true },
    startDate: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    status: { type: String, enum: ["on-track", "at-risk", "completed"], default: "on-track" },
    kpis: [KPISchema],
    createdBy: { type: String }, // User.id of whoever launched this pilot
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pilot", PilotSchema);
