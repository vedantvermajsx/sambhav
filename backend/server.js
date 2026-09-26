require("dotenv").config();
const connectDB = require("./config/db");

if (!process.env.JWT_SECRET) {
  console.error("[server] JWT_SECRET is not set. Add it to backend/.env");
  process.exit(1);
}

const app = require("./app");
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] Sambhav API running on port ${PORT}`));
});
