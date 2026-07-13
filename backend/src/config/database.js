const { PrismaClient } = require("@prisma/client");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const dbUrl = process.env.DATABASE_URL || "mysql://root:local_dev_password@localhost:3306/servicefinder";

const prisma = new PrismaClient({
  datasourceUrl: dbUrl,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Handle connection with retry logic
let retries = 5;
const connectWithRetry = async () => {
  try {
    await prisma.$connect();
  } catch (err) {
    retries -= 1;
    if (retries > 0) {
      setTimeout(() => connectWithRetry(), 5000);
    } else {
      console.error("❌ Database connection failed after all retries:", err);
      console.error(
        "💡 Make sure DATABASE_URL is set correctly in your environment",
      );
      process.exit(1);
    }
  }
};

connectWithRetry();

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
