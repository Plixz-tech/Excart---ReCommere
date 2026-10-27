
import express from "express";
import brandController from "./brand.controller.js";
import upload from "../../middlewares/upload.js";

import {
  createBrandValidator,
  updateBrandValidator,
  validateBrandId,
} from "./brand.validator.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

// Public: fetch brands for dropdowns
router.get("/", brandController.getBrands);

// Admin only: create a brand
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createBrandValidator,
  brandController.createBrand
);

// Admin only: fetch a single brand
router.get(
  "/:id",
  protect,
  authorize("admin"),
  validateBrandId,
  brandController.getBrandById
);

// Admin only: update brand details or logo
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  validateBrandId,
  updateBrandValidator,
  brandController.updateBrand
);

// Admin only: permanently delete a brand
// Keep this route before the generic /:id DELETE route.
router.delete(
  "/:id/permanent",
  protect,
  authorize("admin"),
  validateBrandId,
  brandController.permanentlyDeleteBrand
);

// Admin only: deactivate a brand (existing behavior)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateBrandId,
  brandController.deactivateBrand
);

export default router;
