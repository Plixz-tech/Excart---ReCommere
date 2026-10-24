
import mongoose from "mongoose";

export const createModelValidator = (req, res, next) => {
  const { name, brand, active } = req.body;

  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Model name must contain at least 2 characters.",
    });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "Model name cannot exceed 100 characters.",
    });
  }

  if (
    typeof brand !== "string" ||
    !mongoose.Types.ObjectId.isValid(brand)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid brand ID is required.",
    });
  }

  if (active !== undefined && !["true", "false", true, false].includes(active)) {
    return res.status(400).json({
      success: false,
      message: "Active must be a boolean.",
    });
  }

  next();
};

export const updateModelValidator = (req, res, next) => {
  const { name, brand, active } = req.body;

  if (Object.keys(req.body).length === 0 && !req.file) {
    return res.status(400).json({
      success: false,
      message: "At least one field is required to update a model.",
    });
  }

  if (
    name !== undefined &&
    (typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100)
  ) {
    return res.status(400).json({
      success: false,
      message: "Model name must contain between 2 and 100 characters.",
    });
  }

  if (
    brand !== undefined &&
    (typeof brand !== "string" ||
      !mongoose.Types.ObjectId.isValid(brand))
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid brand ID.",
    });
  }

  if (active !== undefined && !["true", "false", true, false].includes(active)) {
    return res.status(400).json({
      success: false,
      message: "Active must be a boolean.",
    });
  }

  next();
};

export const validateModelId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid model ID.",
    });
  }

  next();
};
