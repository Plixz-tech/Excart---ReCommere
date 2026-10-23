
import mongoose from "mongoose";

export const createBrandValidator = (req, res, next) => {
  const { name, image, active } = req.body;

  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Brand name must contain at least 2 characters.",
    });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "Brand name cannot exceed 100 characters.",
    });
  }

  if (image !== undefined && typeof image !== "string") {
    return res.status(400).json({
      success: false,
      message: "Brand image must be a string URL.",
    });
  }

  if (active !== undefined && typeof active !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Active must be a boolean.",
    });
  }

  next();
};

export const updateBrandValidator = (req, res, next) => {
  const { name, image, active } = req.body;

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one field is required to update a brand.",
    });
  }

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100)
  ) {
    return res.status(400).json({
      success: false,
      message: "Brand name must contain between 2 and 100 characters.",
    });
  }

  if (image !== undefined && typeof image !== "string") {
    return res.status(400).json({
      success: false,
      message: "Brand image must be a string URL.",
    });
  }

  if (active !== undefined && typeof active !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Active must be a boolean.",
    });
  }

  next();
};

export const validateBrandId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid brand ID.",
    });
  }

  next();
};
