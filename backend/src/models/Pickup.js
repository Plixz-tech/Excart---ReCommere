import mongoose from "mongoose";

const pickupSchema = new mongoose.Schema(
  {
    // Customer who booked the pickup
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Device to be picked up
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      unique: true,
    },

    // Agent assigned by admin
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Pickup Address
    address: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine1: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine2: {
        type: String,
        default: "",
        trim: true,
      },

      landmark: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },

      latitude: Number,
      longitude: Number,
    },

    // Schedule
    pickupDate: {
      type: Date,
      required: true,
    },

    pickupTimeSlot: {
      type: String,
      required: true,
    },

    // OTP Verification
    pickupOtp: {
      type: String,
      default: null,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // Customer Remarks
    customerRemarks: {
      type: String,
      default: "",
      trim: true,
    },

    // Agent Remarks
    agentRemarks: {
      type: String,
      default: "",
      trim: true,
    },

    // Timeline
    scheduledAt: {
      type: Date,
      default: Date.now,
    },

    agentAssignedAt: {
      type: Date,
      default: null,
    },

    pickedUpAt: {
      type: Date,
      default: null,
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

export default mongoose.model("Pickup", pickupSchema);