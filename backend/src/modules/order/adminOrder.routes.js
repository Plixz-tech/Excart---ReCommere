import express from "express";

import adminOrderController from "./adminOrder.controller.js";

import {
  updateOrderSchema,
  orderIdSchema,
  orderStatusSchema,
  assignOrderSchema,
} from "./order.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

router.use(
  protect,
  authorize("admin")
);

// Get all orders
router.get(
  "/",
  adminOrderController.getOrders
);

// Get order by ID
router.get(
  "/:id",
  validateRequest(orderIdSchema),
  adminOrderController.getOrderById
);

// Update order
router.patch(
  "/:id",
  validateRequest(updateOrderSchema),
  adminOrderController.updateOrder
);

// Update status
router.patch(
  "/:id/status",
  validateRequest(orderStatusSchema),
  adminOrderController.updateOrderStatus
);

// Assign agent
router.patch(
  "/:id/assign",
  validateRequest(assignOrderSchema),
  adminOrderController.assignOrder
);

// Process payment
// This automatically generates:
// 1. Purchase Invoice
// 2. Payment Slip
router.patch(
  "/:id/payment",
  adminOrderController.processPayment
);

// Get purchase invoice
router.get(
  "/:id/purchase-invoice",
  adminOrderController.getPurchaseInvoice
);

// Get payment slip
router.get(
  "/:id/payment-slip",
  adminOrderController.getPaymentSlip
);

// Receive device
router.patch(
  "/:id/receive",
  adminOrderController.receiveOrder
);

// Delete order
router.delete(
  "/:id",
  validateRequest(orderIdSchema),
  adminOrderController.deleteOrder
);

export default router;