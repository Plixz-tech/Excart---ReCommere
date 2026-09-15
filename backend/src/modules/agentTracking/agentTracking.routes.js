import express from "express";
import agentTrackingController from "./agentTracking.controller.js";
import {
  updateLocationSchema,
  orderTrackingParamsSchema,
} from "./agentTracking.validator.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

router.use(protect);

// AGENT ROUTES

router.patch(
  "/location",
  authorize("agent"),
  validateRequest(updateLocationSchema),
  agentTrackingController.updateMyLocation
);

router.get(
  "/location",
  authorize("agent"),
  agentTrackingController.getMyLocation
);

router.patch(
  "/location/offline",
  authorize("agent"),
  agentTrackingController.setMyLocationOffline
);

// CUSTOMER / AGENT ORDER TRACKING

router.get(
  "/orders/:id",
  validateParams(orderTrackingParamsSchema),
  agentTrackingController.getOrderTracking
);

// ADMIN ROUTE

router.get(
  "/admin/active",
  authorize("admin"),
  agentTrackingController.getAllActiveLocations
);

export default router;