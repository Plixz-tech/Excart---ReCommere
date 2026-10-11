import mongoose from "mongoose";

const deviceCatalogSchema = new mongoose.Schema(
  {
    // BRAND

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    brandImage: {
      type: String,
      default: "",
      trim: true,
    },

    // MODEL

    model: {
      type: String,
      required: true,
      trim: true,
    },

    modelImage: {
      type: String,
      default: "",
      trim: true,
    },

    // VARIANT DETAILS

    variant: {
      type: String,
      default: "",
      trim: true,
    },

    storage: {
      type: String,
      default: "",
      trim: true,
    },

    ram: {
      type: String,
      default: "",
      trim: true,
    },

    // PRICING

    valuationPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    agentCommission: {
      type: Number,
      min: 0,
      default: 0,
    },

// EVALUATION CONFIGURATION

evaluationConfig: {
  battery: {
    type: String,
    enum: ["percentage", "status", "none"],
    default: "none",
  },

  biometric: {
    type: String,
    enum: [
      "face_id",
      "touch_id",
      "fingerprint",
      "fingerprint_face",
      "none",
    ],
    default: "none",
  },
},

    // STATUS

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    // AUDIT

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "DeviceCatalog",
  deviceCatalogSchema
);