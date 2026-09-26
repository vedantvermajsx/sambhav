function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate key", key: err.keyValue });
  }
  res.status(status).json({
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
