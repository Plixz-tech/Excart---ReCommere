import mongoose from "mongoose";
import { env } from "../env/index.js";
import logger from "../logger/index.js";

const connectDatabase = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(error, "MongoDB connection failed");

    process.exit(1);
  }
};

export default connectDatabase;