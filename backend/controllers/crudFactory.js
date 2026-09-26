const asyncHandler = require("express-async-handler");
const crypto = require("crypto");

function genId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

/**
 * @param {mongoose.Model} Model
 * @param {object} opts
 * @param {string} [opts.prefix]
 * @param {string[]} [opts.filterableFields]
 * @param {string} [opts.ownerField] - if set, `create` stamps this field with
 *   req.user.id (ignoring any value the client sent), and `update` strips it
 *   from the request body so ownership can never be reassigned via a PUT.
 * @param {string[]} [opts.protectedFields] - extra fields (beyond "id" and
 *   ownerField, which are always protected) that update can never touch —
 *   e.g. "role" or "password" on User, so a generic PUT can't be used for
 *   privilege escalation or to bypass password hashing.
 */
function crudFactory(Model, { prefix, filterableFields = [], ownerField, protectedFields = [] } = {}) {
  const alwaysStripped = new Set(["id", ...(ownerField ? [ownerField] : []), ...protectedFields]);

  const getAll = asyncHandler(async (req, res) => {
    const filter = {};
    for (const field of filterableFields) {
      if (req.query[field] !== undefined) filter[field] = req.query[field];
    }
    const docs = await Model.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ id: req.params.id });
    if (!doc) {
      res.status(404);
      throw new Error(`${Model.modelName} not found`);
    }
    res.json(doc);
  });

  const create = asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (!body.id) body.id = genId(prefix || Model.modelName.toLowerCase());
    if (ownerField) body[ownerField] = req.user.id; // never trust a client-supplied owner
    const doc = await Model.create(body);
    res.status(201).json(doc);
  });

  const update = asyncHandler(async (req, res) => {
    const body = { ...req.body };
    for (const field of alwaysStripped) delete body[field];

    const doc = await Model.findOneAndUpdate({ id: req.params.id }, body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      res.status(404);
      throw new Error(`${Model.modelName} not found`);
    }
    res.json(doc);
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findOneAndDelete({ id: req.params.id });
    if (!doc) {
      res.status(404);
      throw new Error(`${Model.modelName} not found`);
    }
    res.json({ message: `${Model.modelName} deleted`, id: req.params.id });
  });

  return { getAll, getOne, create, update, remove };
}

module.exports = crudFactory;
