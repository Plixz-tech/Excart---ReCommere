
import mongoose from "mongoose";

const modelSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
      index: true,
    },

    name: {
      type: String,
      required: [true, "Model name is required"],
      trim: true,
      maxlength: 100,
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
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

// Prevent duplicate model names under the same brand.
modelSchema.index(
  { brand: 1, name: 1 },
  { unique: true }
);

const Model = mongoose.model("Model", modelSchema);

export default Model;
