/**
 * Splits `total` points equally between `userIds`. Any remainder is handed out
 * one point at a time from the front of the list, so the shares always add up
 * to exactly `total`.
 *
 * splitPoints(100, ["a", "b", "c"]) -> a: 34, b: 33, c: 33
 */
function splitPoints(total, userIds) {
  if (!total || total <= 0 || userIds.length === 0) return [];
  const base = Math.floor(total / userIds.length);
  let remainder = total - base * userIds.length;
  return userIds.map((userId) => ({
    userId,
    points: base + (remainder-- > 0 ? 1 : 0),
  }));
}

module.exports = { splitPoints };
