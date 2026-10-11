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
      index: true,
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


    // CUSTOMER PROVIDED DEVICE CONDITION


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
      functionalIssues: {
        type: [String],
        default: [],
      },

      // Customer-side IMEI verification
      imeiVerification: {
        verified: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          enum: ["CLEAN", "BLACKLISTED", "UNKNOWN", "ERROR"],
          default: "UNKNOWN",
        },

        deviceMatch: {
          type: Boolean,
          default: false,
        },

        provider: {
          type: String,
          default: "",
          trim: true,
        },

        providerReference: {
          type: String,
          default: "",
          trim: true,
        },

        verifiedAt: {
          type: Date,
          default: null,
        },
      },
    },


    // AGENT PHYSICAL DEVICE INSPECTION


    agentEvaluation: {
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

      // Agent-side IMEI verification
      imeiVerification: {
        verified: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          enum: ["CLEAN", "BLACKLISTED", "UNKNOWN", "ERROR"],
          default: "UNKNOWN",
        },

        deviceMatch: {
          type: Boolean,
          default: false,
        },

        provider: {
          type: String,
          default: "",
          trim: true,
        },

        providerReference: {
          type: String,
          default: "",
          trim: true,
        },

        verifiedAt: {
          type: Date,
          default: null,
        },
      },

      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },
    },

    deviceCatalogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceCatalog",
      required: true,
    },


    // PRICING


    valuationPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    agentCommission: {
      type: Number,
      default: 0,
      min: 0,
    },

    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    expectedSellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    agentValuation: {
      amount: {
        type: Number,
        default: 0,
      },

      totalAdjustment: {
        type: Number,
        default: 0,
      },

      appliedRules: {
        type: [
          {
            ruleId: {
              type: String,
              default: "",
            },

            name: {
              type: String,
              default: "",
            },

            adjustmentType: {
              type: String,
              enum: [
                "deduction",
                "addition",
              ],
            },

            amount: {
              type: Number,
              default: 0,
            },
          },
        ],
        default: [],
      },

      calculatedAt: {
        type: Date,
        default: null,
      },

      calculatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // OWNERSHIP / AGENTS


    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    pickupAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    inspectionAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
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
        "inspection_in_progress",
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