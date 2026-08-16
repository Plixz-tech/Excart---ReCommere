import express from "express";

import orderController from "./order.controller.js";

import {
  createOrderSchema,
} from "./order.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import protect from "../../middlewares/auth/protect.js";

const router = express.Router();

router.use(protect);

// Create my order
router.post(
  "/",
  validateRequest(createOrderSchema),
  orderController.createOrder
);

// Get my orders
router.get(
  "/",
  orderController.getMyOrders
);

// Get my order by ID
router.get(
  "/:id",
  orderController.getMyOrderById
);

// Cancel my order
router.patch(
  "/:id/cancel",
  orderController.cancelOrder
);

export default router;