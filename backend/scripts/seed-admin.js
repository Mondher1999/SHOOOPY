/**
 * Seed script — creates the initial admin user for development.
 * Run: node scripts/seed-admin.js
 * Configure via env vars or fall back to the defaults below.
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/userModel.js";
import logger from "../src/utils/logger.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@shopflow.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shopflow_db");
  logger.info("Connected to MongoDB");

  const existing = await User.findOne({ email: ADMIN_EMAIL }).lean();
  if (existing) {
    logger.info(`Admin already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    isVerified: true,
  });

  logger.info(`Admin created — email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  logger.error("Seed failed:", err);
  process.exit(1);
});
