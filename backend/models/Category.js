const mongoose = require("mongoose");

const CustomFieldDefSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["text", "number", "select"], required: true },
    options: [{ type: String }],
    unit: { type: String },
  },
  { _id: false }
);

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    accentColor: { type: String, required: true },
    customFields: [CustomFieldDefSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
