import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
  {

    // DEVICE MATCHING


    brand: {
      type: String,
      trim: true,
      default: "",
    },

    model: {
      type: String,
      trim: true,
      default: "",
    },

    variant: {
      type: String,
      trim: true,
      default: "",
    },


    // CONDITION


    conditionType: {
      type: String,
      required: true,
      enum: [
        "screenCondition",
        "bodyCondition",
        "batteryHealth",
        "functionalTests",
        "accessories",
        "repairHistory",
        "imeiVerification",
        "overallGrade",
      ],
    },

    conditionKey: {
      type: String,
      trim: true,
      default: "",
    },

    operator: {
      type: String,
      required: true,
      enum: [
        "equals",
        "not_equals",
        "less_than",
        "less_than_or_equal",
        "greater_than",
        "greater_than_or_equal",
      ],
      default: "equals",
    },

    conditionValue: {
      type: String,
      trim: true,
      default: "",
    },


    // PRICE ADJUSTMENT


    adjustmentType: {
      type: String,
      required: true,
      enum: [
        "deduction",
        "addition",
      ],
      default: "deduction",
    },

    adjustmentValue: {
      type: Number,
      required: true,
      min: 0,
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
  "PricingRule",
  pricingRuleSchema
);