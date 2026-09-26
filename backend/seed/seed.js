// Loads the problem categories. Everything else (users, problems, teams) is
// created through the app, so there is no demo data.
//
//   npm run seed             add / update categories
//   npm run seed -- --wipe   also delete ALL users, problems, teams, workspaces

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Category = require("../models/Category");
const User = require("../models/User");
const Problem = require("../models/Problem");
const Team = require("../models/Team");
const Workspace = require("../models/Workspace");

const categories = require("./data/categories.json");

// Collections from older versions of the app that no longer have a model.
const LEGACY_COLLECTIONS = ["organizations", "pilots"];

async function run() {
  await connectDB();

  if (process.argv.includes("--wipe")) {
    await Promise.all(
      [Category, User, Problem, Team, Workspace].map((Model) => Model.deleteMany({}))
    );
    const existing = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
    for (const name of LEGACY_COLLECTIONS.filter((n) => existing.includes(n))) {
      await mongoose.connection.db.dropCollection(name);
    }
    console.log("[seed] Existing data wiped");
  }

  await Category.bulkWrite(
    categories.map((c) => ({
      replaceOne: { filter: { id: c.id }, replacement: c, upsert: true },
    }))
  );
  // Make sure the unique indexes (email, problemId, ...) exist.
  await Promise.all([User, Problem, Team, Workspace, Category].map((M) => M.syncIndexes()));

  console.log(`[seed] Done: ${categories.length} categories`);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
