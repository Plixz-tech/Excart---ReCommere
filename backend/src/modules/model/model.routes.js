
import express from "express";
import modelController from "./model.controller.js";
import {
  createModelValidator,
  updateModelValidator,
  validateModelId,
} from "./model.validator.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

// Public: fetch models for Device Catalog dropdowns
router.get("/", modelController.getModels);

// Admin only: create a model with an optional image
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createModelValidator,
  modelController.createModel
);

// Admin only: fetch a single model
router.get(
  "/:id",
  protect,
  authorize("admin"),
  validateModelId,
  modelController.getModelById
);

// Admin only: update a model and optionally replace its image
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  validateModelId,
  updateModelValidator,
  modelController.updateModel
);

// Admin only: deactivate a model
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateModelId,
  modelController.deactivateModel
);

export default router;
