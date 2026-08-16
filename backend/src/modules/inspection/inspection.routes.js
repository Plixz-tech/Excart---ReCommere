import express from "express";

import * as inspectionController from "./inspection.controller.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";

import {
  createInspectionSchema,
  updateInspectionSchema,
  updateInspectionStatusSchema,
} from "./inspection.validator.js";

const router = express.Router();


// Protect all inspection routes
router.use(protect);


// Get all inspections
router.get(
  "/",
  authorize("admin"),
  inspectionController.getInspections
);


// Get one inspection
router.get(
  "/:id",
  authorize("admin"),
  inspectionController.getInspectionById
);


// Create inspection
router.post(
  "/",
  authorize("admin"),
  validateRequest(createInspectionSchema),
  inspectionController.createInspection
);


// Update inspection details
router.patch(
  "/:id",
  authorize("admin"),
  validateRequest(updateInspectionSchema),
  inspectionController.updateInspection
);


// Update inspection status
router.patch(
  "/:id/status",
  authorize("admin"),
  validateRequest(updateInspectionStatusSchema),
  inspectionController.updateInspectionStatus
);



export default router;