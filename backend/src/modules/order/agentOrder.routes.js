import express from "express";

import agentOrderController from "./agentOrder.controller.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import {
  agentPickupSchema,
} from "./order.validator.js";

const router = express.Router();

router.use(
  protect,
  authorize("agent")
);

// Get all assigned orders
router.get(
  "/",
  agentOrderController.getMyOrders
);

// Get one assigned order
router.get(
  "/:id",
  agentOrderController.getMyOrderById
);

// Pickup order
router.patch(
  "/:id/pickup",
  validateRequest(agentPickupSchema),
  agentOrderController.pickupOrder
);

router.patch(
  "/:id/transit",
  agentOrderController.startTransit
);

export default router;