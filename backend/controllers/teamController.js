const Team = require("../models/Team");
const readController = require("./readController");

module.exports = readController(Team, { filterableFields: ["problemId"] });
