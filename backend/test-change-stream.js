import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development", quiet: true });

await mongoose.connect(process.env.MONGO_URI);

console.log("Watching MongoDB changes...");

const stream = mongoose.connection.db.watch([], {
  maxAwaitTimeMS: 1000,
});

stream.on("change", (change) => {
  console.log("DATABASE CHANGE:", {
    operationType: change.operationType,
    collection: change.ns?.coll,
  });
});

stream.on("error", (error) => {
  console.error("Change Stream error:", error.message);
});

process.on("SIGINT", async () => {
  await stream.close();
  await mongoose.disconnect();
  process.exit(0);
});
