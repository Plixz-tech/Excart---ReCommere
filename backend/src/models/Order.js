import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {

    // ORDER BASIC INFORMATION


    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },


    // ORDER STATUS


    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "pickup_scheduled",
        "picked_up",
        "in_transit",
        "inspection_pending",
        "inspection_in_progress",
        "inspection_completed",
        "ready_stock",
        "cancelled",
        "rejected",
      ],
      default: "pending",
      index: true,
    },


    // PAYMENT


    payment: {
      status: {
        type: String,
        enum: [
          "pending",
          "processing",
          "completed",
          "failed",
          "cancelled",
        ],
        default: "pending",
      },

      estimatedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      finalAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      paymentMethod: {
        type: String,
        enum: [
          "bank_transfer",
          "upi",
          "cash",
          "other",
        ],
        default: null,
      },

      transactionId: {
        type: String,
        default: "",
      },

      paidAt: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        default: "",
      },
    },


    // DEVICE


    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      default: null,
    },


    // PICKUP DETAILS


    pickup: {
      status: {
        type: String,
        enum: [
          "pending",
          "assigned",
          "scheduled",
          "in_progress",
          "completed",
          "cancelled",
        ],
        default: "pending",
      },

      scheduledDate: {
        type: Date,
        default: null,
      },

      scheduledTime: {
        type: String,
        default: "",
      },

      assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      address: {
        line1: {
          type: String,
          default: "",
        },

        city: {
          type: String,
          default: "",
        },

        state: {
          type: String,
          default: "",
        },

        pinCode: {
          type: String,
          default: "",
        },

        latitude: {
          type: Number,
          default: null,
        },

        longitude: {
          type: Number,
          default: null,
        },
      },

      notes: {
        type: String,
        default: "",
      },

      pickedUpAt: {
        type: Date,
        default: null,
      },
    },


    // INSPECTION


    inspection: {
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

      condition: {
        type: String,
        default: "",
      },

      grade: {
        type: String,
        default: "",
      },

      physicalCondition: {
        type: String,
        default: "",
      },

      screenCondition: {
        type: String,
        default: "",
      },

      batteryHealth: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      functionalIssues: {
        type: [String],
        default: [],
      },

      inspectionNotes: {
        type: String,
        default: "",
      },

      inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      inspectedAt: {
        type: Date,
        default: null,
      },

      approvedAt: {
        type: Date,
        default: null,
      },
    },


    // DOCUMENTS

    documents: [
      {
        type: {
          type: String,
          enum: [
            "aadhaar",
            "pan",
            "device_invoice",
            "purchase_invoice",
            "payment_slip",
            "ownership",
            "purchase_proof",
            "other",
          ]
        },

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
    // INVENTORY / SALES


    inventory: {
      status: {
        type: String,
        enum: [
          "not_added",
          "in_inventory",
          "listed",
          "sold",
        ],
        default: "not_added",
      },

      inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        default: null,
      },

      listedPrice: {
        type: Number,
        default: 0,
        min: 0,
      },

      soldPrice: {
        type: Number,
        default: 0,
        min: 0,
      },

      soldAt: {
        type: Date,
        default: null,
      },
    },


    // TIMELINE


    timeline: [
      {
        status: {
          type: String,
          required: true,
        },

        message: {
          type: String,
          default: "",
        },

        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],


    // NOTES


    notes: {
      type: String,
      default: "",
    },

    cancellationReason: {
      type: String,
      default: "",
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

export default mongoose.model("Order", orderSchema);