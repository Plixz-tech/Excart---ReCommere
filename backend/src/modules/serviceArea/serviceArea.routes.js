import { Router } from "express";

import * as serviceAreaController from "./serviceArea.controller.js";

import {
  createServiceAreaSchema,
  updateServiceAreaSchema,
  serviceAreaIdSchema,
} from "./serviceArea.validator.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

const router = Router();

// Check serviceability by pincode
router.get(
  "/check/:pincode",
  serviceAreaController.checkServiceability
);

// Check serviceability by location
router.get(
  "/check-location",
  serviceAreaController.checkLocationServiceability
);

// Create service area
router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(createServiceAreaSchema),
  serviceAreaController.createServiceArea
);

// Get all service areas
router.get(
  "/",
  protect,
  authorize("admin"),
  serviceAreaController.getServiceAreas
);

// Get service area by ID
router.get(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(serviceAreaIdSchema),
  serviceAreaController.getServiceAreaById
);

// Update service area
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(serviceAreaIdSchema),
  validateRequest(updateServiceAreaSchema),
  serviceAreaController.updateServiceArea
);

// Delete service area
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(serviceAreaIdSchema),
  serviceAreaController.deleteServiceArea
);

export default router;