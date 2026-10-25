
import mongoose from "mongoose";
import logger from "../logger/index.js";
import { getIO } from "../socket/index.js";

// Only business collections that should trigger admin data refreshes.
// MongoDB's default Mongoose collection names are lowercase and plural.
const WATCHED_COLLECTIONS = new Set([
  "addresses",
  "agentearnings",
  "brands",
  "devicecatalogs",
  "devices",
  "faqs",
  "inspections",
  "inventories",
  "issues",
  "models",
  "orders",
  "payoutaccounts",
  "pickups",
  "pricingrules",
  "reviews",
  "serviceareas",
  "users",
]);

let changeStream;
let resumeToken;
let isStopping = false;

const collectionToEntity = (collectionName) => {
  const normalized = collectionName.toLowerCase();

  const mappings = {
    addresses: "addresses",
    agentearnings: "agentEarnings",
    brands: "brands",
    devicecatalogs: "deviceCatalogs",
    devices: "devices",
    faqs: "faqs",
    inspections: "inspections",
    inventories: "inventory",
    issues: "issues",
    models: "models",
    orders: "orders",
    payoutaccounts: "payoutAccounts",
    pickups: "pickups",
    pricingrules: "pricingRules",
    reviews: "reviews",
    serviceareas: "serviceAreas",
    users: "users",
  };

  return mappings[normalized] || normalized;
};

export const startChangeStream = () => {
  if (changeStream) {
    return changeStream;
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error(
      "MongoDB must be connected before starting the Change Stream."
    );
  }

  isStopping = false;

  const pipeline = [
    {
      $match: {
        operationType: {
          $in: ["insert", "update", "replace", "delete"],
        },
        "ns.coll": {
          $in: [...WATCHED_COLLECTIONS],
        },
      },
    },
  ];

  const options = {
    fullDocument: "updateLookup",
    ...(resumeToken ? { resumeAfter: resumeToken } : {}),
  };

  changeStream = mongoose.connection.db.watch(pipeline, options);

  changeStream.on("change", (change) => {
    resumeToken = change._id;

    try {
      const io = getIO();
      const collectionName = change.ns?.coll;

      if (!collectionName) {
        return;
      }

      const actionMap = {
        insert: "created",
        update: "updated",
        replace: "updated",
        delete: "deleted",
      };

      io.to("admins").emit("data:changed", {
        entity: collectionToEntity(collectionName),
        action: actionMap[change.operationType] || "updated",
        recordId: change.documentKey?._id?.toString(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(error, "Failed to broadcast database change");
    }
  });

  changeStream.on("error", (error) => {
    logger.error(error, "MongoDB Change Stream error");

    changeStream = null;

    if (!isStopping) {
      logger.error(
        "Change Stream stopped. A restart/recovery strategy is required."
      );
    }
  });

  changeStream.on("close", () => {
    changeStream = null;

    if (!isStopping) {
      logger.warn("MongoDB Change Stream closed unexpectedly");
    }
  });

  logger.info("MongoDB Change Stream started");

  return changeStream;
};

export const stopChangeStream = async () => {
  isStopping = true;

  if (changeStream) {
    await changeStream.close();
    changeStream = null;
  }
};
