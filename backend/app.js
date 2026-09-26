require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const userRoutes = require("./routes/userRoutes");
const problemRoutes = require("./routes/problemRoutes");
const pilotRoutes = require("./routes/pilotRoutes");
const teamRoutes = require("./routes/teamRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// Allow all origins (reflects request origin; needed for credentials: true).
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get(["/health", "/api/health"], (req, res) =>
  res.json({ status: "ok", service: "sambhav-backend", timestamp: new Date().toISOString() })
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/pilots", pilotRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
