import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema(
  {
    // Device
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },

    // Agent who inspected
    inspectionAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Physical Checks
    physicalCondition: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      default: "Good",
    },

    screenCondition: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor", "Broken"],
      default: "Good",
    },

    bodyCondition: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      default: "Good",
    },

    batteryHealth: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    camera: {
      type: Boolean,
      default: true,
    },

    speaker: {
      type: Boolean,
      default: true,
    },

    microphone: {
      type: Boolean,
      default: true,
    },

    chargingPort: {
      type: Boolean,
      default: true,
    },

    wifi: {
      type: Boolean,
      default: true,
    },

    bluetooth: {
      type: Boolean,
      default: true,
    },

    network: {
      type: Boolean,
      default: true,
    },

    faceId: {
      type: Boolean,
      default: true,
    },

    fingerprint: {
      type: Boolean,
      default: true,
    },

    // Overall Result
    overallGrade: {
      type: String,
      enum: ["A+", "A", "B", "C", "D"],
      default: "B",
    },

    estimatedPrice: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    // Inspection Images
    photos: [
      {
        url: String,
        publicId: String,
        uploadedAt: Date,
      },
    ],

    // Status
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

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

export default mongoose.model("Inspection", inspectionSchema);