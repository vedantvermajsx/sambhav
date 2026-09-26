const express = require("express");
const Organization = require("../models/Organization");
const crudFactory = require("../controllers/crudFactory");
const { protect, restrictTo } = require("../middleware/auth");
const { restrictToOwner } = require("../middleware/ownership");

const router = express.Router();
const ctrl = crudFactory(Organization, {
  prefix: "org",
  filterableFields: ["type", "verificationStatus"],
  ownerField: "createdBy",
});

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", protect, ctrl.create);
router.put("/:id", protect, restrictToOwner(Organization, "createdBy", ["org"]), ctrl.update);
router.delete("/:id", protect, restrictTo("org"), ctrl.remove);

module.exports = router;
