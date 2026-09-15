import express from "express";

import * as inspectionController from "./inspection.controller.js";

import protect from "../../middlewares/auth/protect.js";

import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import validateParams from "../../middlewares/validation/validateParams.js";

import {
  createInspectionSchema,
  inspectionIdSchema,
  updateInspectionSchema,
  completeInspectionSchema,
  updateInspectionStatusSchema,
} from "./inspection.validator.js";

const router = express.Router();

router.use(protect);

router.get(
  "/pending",
  authorize("admin"),
  inspectionController.getPendingInspections
);

router.get(
  "/",
  authorize("admin"),
  inspectionController.getInspections
);

router.get(
  "/:id",
  authorize("admin"),
  validateParams(inspectionIdSchema),
  inspectionController.getInspectionById
);

router.post(
  "/",
  authorize("admin"),
  validateRequest(createInspectionSchema),
  inspectionController.createInspection
);

router.patch(
  "/:id",
  authorize("admin"),
  validateParams(inspectionIdSchema),
  validateRequest(updateInspectionSchema),
  inspectionController.updateInspection
);

router.patch(
  "/:id/complete",
  authorize("admin"),
  validateParams(inspectionIdSchema),
  validateRequest(completeInspectionSchema),
  inspectionController.completeInspection
);

router.patch(
  "/:id/status",
  authorize("admin"),
  validateParams(inspectionIdSchema),
  validateRequest(updateInspectionStatusSchema),
  inspectionController.updateInspectionStatus
);

export default router;