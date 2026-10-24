
import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema(
  {
    // ORDER / DEVICE REFERENCE
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true,
    },

    // AGENT WHO PERFORMED THE INSPECTION
    inspectionAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // SCREEN CONDITION
    screenCondition: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor", "Broken"],
      default: null,
    },

    // BODY CONDITION
    bodyCondition: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      default: null,
    },

    // BATTERY HEALTH
    batteryHealth: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // FUNCTIONAL TESTS
    functionalTests: {
      camera: {
        type: Boolean,
        default: null,
      },
      speaker: {
        type: Boolean,
        default: null,
      },
      microphone: {
        type: Boolean,
        default: null,
      },
      buttons: {
        type: Boolean,
        default: null,
      },
      touchScreen: {
        type: Boolean,
        default: null,
      },
      chargingPort: {
        type: Boolean,
        default: null,
      },
      wifi: {
        type: Boolean,
        default: null,
      },
      bluetooth: {
        type: Boolean,
        default: null,
      },
      network: {
        type: Boolean,
        default: null,
      },
      faceId: {
        type: Boolean,
        default: null,
      },
      fingerprint: {
        type: Boolean,
        default: null,
      },
      vibration: {
        type: Boolean,
        default: null,
      },
      gps: {
        type: Boolean,
        default: null,
      },
    },

    // ACCESSORIES
    accessories: {
      charger: {
        type: Boolean,
        default: false,
      },
      cable: {
        type: Boolean,
        default: false,
      },
      earphones: {
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

    // REPAIR HISTORY
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

    // IMEI VERIFICATION
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
      verifiedAt: {
        type: Date,
        default: null,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // OVERALL GRADE
    overallGrade: {
      type: String,
      enum: ["A+", "A", "B", "C", "D"],
      default: null,
    },

    // ESTIMATED RESALE PRICE
    estimatedPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    // INSPECTOR REMARKS
    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    // INSPECTION PHOTOS
    photos: [
      {
        url: {
          type: String,
          default: "",
        },
        publicId: {
          type: String,
          default: "",
        },
        fileName: {
          type: String,
          default: "",
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // INSPECTION STATUS
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
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
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

export default mongoose.model("Inspection", inspectionSchema);
