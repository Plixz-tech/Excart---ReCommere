import mongoose from "mongoose";

const payoutAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["bank", "upi"],
      required: true,
    },

    accountHolderName: {
      type: String,
      trim: true,
      default: "",
    },

    bankAccountNumber: {
      type: String,
      trim: true,
      default: "",
      select: false,
    },

    bankIfsc: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    upiId: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    cashfreeBeneficiaryId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    cashfreeBeneficiaryStatus: {
      type: String,
      enum: [
        "not_created",
        "created",
        "failed",
      ],
      default: "not_created",
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
      ],
      default: "active",
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

export default mongoose.model(
  "PayoutAccount",
  payoutAccountSchema
);