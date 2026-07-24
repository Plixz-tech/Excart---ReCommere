import { env } from "./config/env/index.js";
import logger from "./config/logger/index.js";
import connectDatabase from "./config/database/index.js";
import app from "./app.js";

const startServer = async () => {
  try {
    logger.info(" ExCart Backend Starting...");

    await connectDatabase();

    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
};

startServer();