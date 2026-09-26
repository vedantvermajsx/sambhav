require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const problemRoutes = require("./routes/problemRoutes");
const teamRoutes = require("./routes/teamRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// CLIENT_ORIGIN can hold several origins, comma separated.
const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get(["/health", "/api/health"], (req, res) =>
  res.json({ status: "ok", service: "sambhav-backend", timestamp: new Date().toISOString() })
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
