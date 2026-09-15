import mongoose from "mongoose";

const agentLocationSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },

    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
      index: true,
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

agentLocationSchema.index({
  agent: 1,
  order: 1,
});

agentLocationSchema.index({
  status: 1,
  lastUpdatedAt: -1,
});

const AgentLocation = mongoose.model(
  "AgentLocation",
  agentLocationSchema
);

export default AgentLocation;