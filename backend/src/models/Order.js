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

    agentCommission: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ORDER STATUS

    status: {
      type: String,
      enum: [
        "pending",
        "pickup_scheduled",
        "assigned",
        "picked_up",
        "in_transit",
        "inspection_pending",
        "inspection_in_progress",
        "inspection_completed",
        "approved",
        "payment_pending",
        "payment_completed",
        "ready_stock",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
      index: true,
    },

    // DEVICE

    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
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
        trim: true,
      },

      paidAt: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      payout: {
        provider: {
          type: String,
          enum: [
            "cashfree",
            "manual",
          ],
          default: null,
        },

        beneficiaryId: {
          type: String,
          default: "",
          trim: true,
        },

        transferId: {
          type: String,
          default: "",
          trim: true,
        },

        referenceId: {
          type: String,
          default: "",
          trim: true,
        },

        status: {
          type: String,
          enum: [
            "not_started",
            "pending",
            "processing",
            "success",
            "failed",
            "cancelled",
          ],
          default: "not_started",
        },

        amount: {
          type: Number,
          default: 0,
          min: 0,
        },

        initiatedAt: {
          type: Date,
          default: null,
        },

        completedAt: {
          type: Date,
          default: null,
        },

        failureReason: {
          type: String,
          default: "",
          trim: true,
        },
      },
    },

    // PICKUP

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
        trim: true,
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
          trim: true,
        },

        city: {
          type: String,
          default: "",
          trim: true,
        },

        state: {
          type: String,
          default: "",
          trim: true,
        },

        pinCode: {
          type: String,
          default: "",
          trim: true,
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

      mapsUrl: {
        type: String,
        default: "",
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      // PICKUP VERIFICATION

      verification: {
        // CUSTOMER PHOTO

        customerPhoto: {
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
            default: null,
          },
        },

        // AADHAAR OFFLINE e-KYC

        aadhaar: {
          // Offline e-KYC XML upload metadata

          xml: {
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
              default: null,
            },
          },

          // Optional Aadhaar supporting document

          document: {
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
              default: null,
            },
          },

          // VERIFICATION RESULT

          verification: {
            status: {
              type: String,
              enum: [
                "not_uploaded",
                "pending",
                "verified",
                "rejected",
              ],
              default: "not_uploaded",
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

            referenceId: {
              type: String,
              default: "",
              trim: true,
            },

            aadhaarLast4: {
              type: String,
              default: "",
              trim: true,
            },

            name: {
              type: String,
              default: "",
              trim: true,
            },

            dateOfBirth: {
              type: String,
              default: "",
              trim: true,
            },

            gender: {
              type: String,
              default: "",
              trim: true,
            },

            address: {
              type: mongoose.Schema.Types.Mixed,
              default: null,
            },

            notes: {
              type: String,
              default: "",
              trim: true,
            },
          },
        },

        // OVERALL PICKUP VERIFICATION

        status: {
          type: String,
          enum: [
            "pending",
            "verified",
            "rejected",
          ],
          default: "pending",
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

      // Actual pickup completion time

      pickedUpAt: {
        type: Date,
        default: null,
      },
    },

    // INSPECTION SUMMARY

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
        trim: true,
      },

      grade: {
        type: String,
        default: "",
        trim: true,
      },

      physicalCondition: {
        type: String,
        default: "",
        trim: true,
      },

      screenCondition: {
        type: String,
        default: "",
        trim: true,
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
        trim: true,
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

      rejectionReason: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // DOCUMENTS

    documents: [
      {
        type: {
          type: String,
          enum: [
            "aadhaar",
            "aadhaar_offline_ekyc",
            "pan",
            "device_invoice",
            "purchase_invoice",
            "payment_slip",
            "ownership",
            "purchase_proof",
            "other",
          ],
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

        invoiceNumber: {
          type: String,
          default: "",
          trim: true,
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
        ref: "Inventory",
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
          trim: true,
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
      trim: true,
    },

    cancellationReason: {
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

export default mongoose.model("Order", orderSchema);