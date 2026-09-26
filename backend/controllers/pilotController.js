const asyncHandler = require("express-async-handler");
const Pilot = require("../models/Pilot");
const crudFactory = require("./crudFactory");

const base = crudFactory(Pilot, {
  prefix: "pilot",
  filterableFields: ["problemId", "status"],
  ownerField: "createdBy",
});

const addKpiPoint = asyncHandler(async (req, res) => {
  const { week, value } = req.body;
  if (week === undefined || value === undefined) {
    res.status(400);
    throw new Error("week and value are required");
  }
  const pilot = await Pilot.findOne({ id: req.params.id });
  if (!pilot) {
    res.status(404);
    throw new Error("Pilot not found");
  }
  const kpi = pilot.kpis.find((k) => k.name === req.params.kpiName);
  if (!kpi) {
    res.status(404);
    throw new Error("KPI not found on this pilot");
  }
  kpi.series.push({ week, value });
  kpi.currentValue = value;
  await pilot.save();
  res.status(201).json(pilot);
});

module.exports = { ...base, addKpiPoint };
