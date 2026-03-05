import mongoose from "mongoose";
import logger from "../utils/logger.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

async function connectDB(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      logger.error(`MongoDB connection failed after ${MAX_RETRIES} attempts:`, error);
      process.exit(1);
    }
    const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
    logger.warn(`MongoDB connection attempt ${attempt} failed. Retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectDB(attempt + 1);
  }
}

export default connectDB;
