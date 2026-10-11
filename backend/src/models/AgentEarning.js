import mongoose from "mongoose";

const agentEarningSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "paid",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    payout: {
      provider: {
        type: String,
        enum: ["cashfree", "manual"],
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

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

agentEarningSchema.index({
  agent: 1,
  createdAt: -1,
});

agentEarningSchema.index({
  agent: 1,
  status: 1,
  createdAt: -1,
});

export default mongoose.model(
  "AgentEarning",
  agentEarningSchema
);