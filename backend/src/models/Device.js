import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {

    // DEVICE DETAILS


    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    variant: {
      type: String,
      default: "",
      trim: true,
    },

    color: {
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


    // DEVICE IDENTITY


    imei1: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    imei2: {
      type: String,
      default: "",
      trim: true,
    },

    serialNumber: {
      type: String,
      default: "",
      trim: true,
    },


    // CUSTOMER PROVIDED DEVICE
    // CONDITION DETAILS


    customerEvaluation: {
      screenCondition: {
        type: String,
        default: "",
      },

      displayIssues: {
        type: [String],
        default: [],
      },

      bodyCondition: {
        type: String,
        default: "",
      },

      batteryHealth: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      repairHistory: {
        type: String,
        default: "",
      },

      accessories: {
        type: [String],
        default: [],
      },

      functionalIssues: {
        type: [String],
        default: [],
      },

      imeiVerification: {
        verified: {
          type: Boolean,
          default: false,
        },

        verifiedAt: {
          type: Date,
          default: null,
        },
      },
    },


    // PRICING


    purchasePrice: {
      type: Number,
      default: 0,
    },

    expectedSellingPrice: {
      type: Number,
      default: 0,
    },


    // OWNERSHIP


    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    pickupAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    inspectionAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },


    // PHOTOS


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

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],


    // DEVICE STATUS


    status: {
      type: String,
      enum: [
        "pending_pickup",
        "picked_up",
        "in_transit",
        "received_in_shop",
        "inspection_pending",
        "inspection_completed",
        "approved",
        "rejected",
        "inventory",
        "listed",
        "sold",
        "returned",
        "deleted",
      ],
      default: "pending_pickup",
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

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Device", deviceSchema);