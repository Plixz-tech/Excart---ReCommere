
import mongoose from "mongoose";

const orderEvaluationSchema = new mongoose.Schema(
  {
    // CUSTOMER WHO STARTED THE EVALUATION
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },

    // SECURE GUEST ACCESS TOKEN HASH
    guestTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    // SELECTED DEVICE FROM THE EXISTING CATALOG
    deviceCatalogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceCatalog",
      required: true,
      index: true,
    },

    // CUSTOMER DEVICE IMEI (STORED, NOT VERIFIED)
    imei1: {
      type: String,
      trim: true,
      default: "",
    },

    // CUSTOMER'S EVALUATION ANSWERS
    customerEvaluation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // PHOTOS UPLOADED BEFORE ORDER CONFIRMATION
    photos: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },

        publicId: {
          type: String,
          default: "",
          trim: true,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // LATEST CALCULATED PRICE DETAILS
    pricing: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // EVALUATION WORKFLOW STATUS
    status: {
      type: String,
      enum: [
        "draft",
        "priced",
        "confirmed",
        "expired",
      ],
      default: "draft",
      index: true,
    },

    // LINK TO THE ORDER AFTER CONFIRMATION
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    // OPTIONAL EXPIRY TIME FOR UNFINISHED EVALUATIONS
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "OrderEvaluation",
  orderEvaluationSchema
);
