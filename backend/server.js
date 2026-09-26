require("dotenv").config();
const connectDB = require("./config/db");

if (!process.env.JWT_SECRET) {
  console.error("[server] JWT_SECRET is not set. Add it to backend/.env");
  process.exit(1);
}

const app = require("./app");
const PORT = process.env.PORT || 5000;

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function startHealthPing(port) {
  const url = process.env.HEALTH_PING_URL || `http://127.0.0.1:${port}/health`;
  console.log(`[health-ping] Starting infinite health fetcher every 5 minutes targeting ${url}`);

  setInterval(async () => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`[health-ping] ${new Date().toISOString()} - Status ${res.status}:`, data);
    } catch (err) {
      console.error(`[health-ping] ${new Date().toISOString()} - Ping error:`, err.message);
    }
  }, FIVE_MINUTES_MS);
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Sambhav API running on port ${PORT}`);
    startHealthPing(PORT);
  });
});
