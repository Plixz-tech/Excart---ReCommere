import express from "express";

import agentOrderController from "./agentOrder.controller.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";

import {
  orderIdSchema,
  agentPickupSchema,
  pickupVerificationSchema,
} from "./order.validator.js";

const router = express.Router();

router.use(
  protect,
  authorize("agent")
);

// GET MY ASSIGNED ORDERS

router.get(
  "/",
  agentOrderController.getMyOrders
);

// GET MY ASSIGNED ORDER

router.get(
  "/:id",
  validateRequest(orderIdSchema),
  agentOrderController.getMyOrderById
);

// SELF ASSIGN ORDER

router.patch(
  "/:id/self-assign",
  validateRequest(orderIdSchema),
  agentOrderController.selfAssignOrder
);

// PICKUP VERIFICATION

router.patch(
  "/:id/pickup-verification",
  validateRequest(orderIdSchema),
  validateRequest(pickupVerificationSchema),
  agentOrderController.verifyPickup
);

// PICKUP ORDER

router.patch(
  "/:id/pickup",
  validateRequest(orderIdSchema),
  validateRequest(agentPickupSchema),
  agentOrderController.pickupOrder
);

// START TRANSIT

router.patch(
  "/:id/transit",
  validateRequest(orderIdSchema),
  agentOrderController.startTransit
);

export default router;