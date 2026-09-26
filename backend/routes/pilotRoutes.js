const express = require("express");
const ctrl = require("../controllers/pilotController");
const { protect } = require("../middleware/auth");
const { restrictToOwner } = require("../middleware/ownership");
const Pilot = require("../models/Pilot");

const router = express.Router();

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", protect, ctrl.create);
router.post("/:id/kpis/:kpiName/points", protect, restrictToOwner(Pilot, "createdBy"), ctrl.addKpiPoint);
router.put("/:id", protect, restrictToOwner(Pilot, "createdBy"), ctrl.update);
router.delete("/:id", protect, restrictToOwner(Pilot, "createdBy"), ctrl.remove);

module.exports = router;
