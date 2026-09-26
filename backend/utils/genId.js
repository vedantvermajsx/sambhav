const crypto = require("crypto");

/** `prefix_<12 hex chars>`, e.g. user_a1b2c3d4e5f6 */
module.exports = function genId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
};
