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

router.use(protect);


// GET ALL PENDING INSPECTIONS
router.get(
  "/pending",
  authorize("admin"),
  inspectionController.getPendingInspections
);


// GET ALL INSPECTIONS
router.get(
  "/",
  authorize("admin"),
  inspectionController.getInspections
);

router.get(
  "/pending",
  authorize("admin"),
  inspectionController.getPendingInspections
);

router.get(
  "/:id",
  authorize("admin"),
  inspectionController.getInspectionById
);

// GET ONE INSPECTION
router.get(
  "/:id",
  authorize("admin"),
  inspectionController.getInspectionById
);


// START INSPECTION
router.post(
  "/",
  authorize("admin"),
  validateRequest(createInspectionSchema),
  inspectionController.createInspection
);


// UPDATE INSPECTION / SAVE DRAFT
router.patch(
  "/:id",
  authorize("admin"),
  validateRequest(updateInspectionSchema),
  inspectionController.updateInspection
);


// APPROVE / REJECT
router.patch(
  "/:id/status",
  authorize("admin"),
  validateRequest(updateInspectionStatusSchema),
  inspectionController.updateInspectionStatus
);

export default router;