const asyncHandler = require("express-async-handler");

/**
 * GET-list and GET-one handlers for a model that has a string `id` field.
 * `filterableFields` are the query-string params allowed to filter the list.
 * `select` limits which fields are returned.
 */
function readController(Model, { filterableFields = [], select } = {}) {
  const getAll = asyncHandler(async (req, res) => {
    const filter = {};
    for (const field of filterableFields) {
      // Only plain strings — never let a client inject a Mongo operator object.
      if (typeof req.query[field] === "string") filter[field] = req.query[field];
    }
    let query = Model.find(filter).sort({ createdAt: -1 });
    if (select) query = query.select(select);
    res.json(await query);
  });

  const getOne = asyncHandler(async (req, res) => {
    let query = Model.findOne({ id: req.params.id });
    if (select) query = query.select(select);
    const doc = await query;
    if (!doc) {
      res.status(404);
      throw new Error(`${Model.modelName} not found`);
    }
    res.json(doc);
  });

  return { getAll, getOne };
}

module.exports = readController;
