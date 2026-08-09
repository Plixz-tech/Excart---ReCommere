import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema(
  {
    // Device Reference
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      unique: true, 
    },

    // Agent who performed the inspection
    inspectionAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Screen Condition
    screenCondition: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor", "Broken"],
      default: "Good",
    },

    // Body Condition
    bodyCondition: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      default: "Good",
    },

    // Battery Health
    batteryHealth: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    // Functional Tests
    functionalTests: {
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
    },

    // Accessories
    accessories: {
      charger: {
        type: Boolean,
        default: false,
      },

      cable: {
        type: Boolean,
        default: false,
      },

      box: {
        type: Boolean,
        default: false,
      },

      bill: {
        type: Boolean,
        default: false,
      },

      simEjector: {
        type: Boolean,
        default: false,
      },
    },

    // Repair History
    repairHistory: {
      repaired: {
        type: Boolean,
        default: false,
      },

      remarks: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // IMEI Verification
    imeiVerification: {
      verified: {
        type: Boolean,
        default: false,
      },

      remarks: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // Overall Grade
    overallGrade: {
      type: String,
      enum: ["A+", "A", "B", "C", "D"],
      default: "B",
    },

    // Estimated Resale Price
    estimatedPrice: {
      type: Number,
      default: 0,
    },

    // Inspector Remarks
    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    // Inspection Photos
    photos: [
      {
        url: {
          type: String,
        },

        publicId: {
          type: String,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Inspection Status
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

    completedAt: {
      type: Date,
      default: null,
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