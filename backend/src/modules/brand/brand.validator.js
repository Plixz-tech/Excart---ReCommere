
import mongoose from "mongoose";

function normalizeActive(req, res, next) {
  if (req.body.active === "true") {
    req.body.active = true;
  } else if (req.body.active === "false") {
    req.body.active = false;
  }

  next();
}

export const createBrandValidator = [
  normalizeActive,
  (req, res, next) => {
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
  },
];

export const updateBrandValidator = [
  normalizeActive,
  (req, res, next) => {
    const { name, image, active } = req.body;
    const hasUploadedImage = Boolean(req.file);

    if (
      Object.keys(req.body).length === 0 &&
      !hasUploadedImage
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a field or logo to update the brand.",
      });
    }

    if (
      name !== undefined &&
      (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
      )
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
  },
];

export const validateBrandId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid brand ID.",
    });
  }

  next();
};
