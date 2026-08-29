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

    // Agent who performed the inspection
    inspectionAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

  
    // SCREEN CONDITION
  

    screenCondition: {
      type: String,
      enum: [
        "Excellent",
        "Good",
        "Average",
        "Poor",
        "Broken",
      ],
      default: "Good",
    },

  
    // BODY CONDITION
  

    bodyCondition: {
      type: String,
      enum: [
        "Excellent",
        "Good",
        "Average",
        "Poor",
      ],
      default: "Good",
    },

  
    // BATTERY HEALTH
  

    batteryHealth: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

  
    // FUNCTIONAL TESTS
  

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
      enum: [
        "A+",
        "A",
        "B",
        "C",
        "D",
      ],
      default: "B",
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

export default mongoose.model(
  "Inspection",
  inspectionSchema
);