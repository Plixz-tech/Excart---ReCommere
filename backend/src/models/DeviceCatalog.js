
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

    // CONDITION-BASED PRICE DEDUCTIONS
    conditionDeductions: {
      type: [
        new mongoose.Schema(
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },

            amount: {
              type: Number,
              required: true,
              min: 0,
            },

            active: {
              type: Boolean,
              default: true,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // EVALUATION CONFIGURATION
    evaluationConfig: {
      screenCondition: {
        enabled: {
          type: Boolean,
          default: true,
        },
        options: {
          type: [String],
          default: ["Excellent", "Good", "Average", "Poor"],
        },
      },

      displayIssues: {
        enabled: {
          type: Boolean,
          default: true,
        },
        allowMultiple: {
          type: Boolean,
          default: true,
        },
        options: {
          type: [String],
          default: [
            "No issues",
            "Light spots",
            "Yellow tint",
            "Flickering",
            "Touch not working",
          ],
        },
      },

      bodyCondition: {
        enabled: {
          type: Boolean,
          default: true,
        },
        options: {
          type: [String],
          default: ["Excellent", "Good", "Average", "Poor"],
        },
      },

      batteryHealth: {
        enabled: {
          type: Boolean,
          default: true,
        },
        inputType: {
          type: String,
          enum: ["percentage", "status", "none"],
          default: "percentage",
        },
        options: {
          type: [String],
          default: [
            "100%",
            "99–95%",
            "94–90%",
            "89–85%",
            "84–80%",
            "Below 80%",
          ],
        },
      },

      repairHistory: {
        enabled: {
          type: Boolean,
          default: true,
        },
        options: {
          type: [String],
          default: [
            "Original / Not Repaired",
            "Repaired",
            "Refurbished",
          ],
        },
      },

      accessories: {
        enabled: {
          type: Boolean,
          default: true,
        },
        allowMultiple: {
          type: Boolean,
          default: true,
        },
        options: {
          type: [String],
          default: [
            "Charger",
            "Earphones",
            "Original box",
            "Bill / Invoice",
          ],
        },
      },

      functionalChecks: {
        enabled: {
          type: Boolean,
          default: true,
        },
        options: {
          type: [String],
          default: [
            "Camera",
            "Speaker",
            "Microphone",
            "Buttons",
            "Fingerprint / Face ID",
            "Touch",
            "Wi-Fi & Bluetooth",
          ],
        },
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
