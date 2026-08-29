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

// GET ALL ORDERS

router.get(
  "/",
  adminOrderController.getOrders
);

// GET ORDER BY ID

router.get(
  "/:id",
  validateRequest(orderIdSchema),
  adminOrderController.getOrderById
);

// UPDATE ORDER

router.patch(
  "/:id",
  validateRequest(orderIdSchema),
  validateRequest(updateOrderSchema),
  adminOrderController.updateOrder
);

// UPDATE ORDER STATUS

router.patch(
  "/:id/status",
  validateRequest(orderIdSchema),
  validateRequest(orderStatusSchema),
  adminOrderController.updateOrderStatus
);

// ASSIGN ORDER

router.patch(
  "/:id/assign",
  validateRequest(orderIdSchema),
  validateRequest(assignOrderSchema),
  adminOrderController.assignOrder
);


// GET PURCHASE INVOICE

router.get(
  "/:id/purchase-invoice",
  validateRequest(orderIdSchema),
  adminOrderController.getPurchaseInvoice
);

// GET PAYMENT SLIP

router.get(
  "/:id/payment-slip",
  validateRequest(orderIdSchema),
  adminOrderController.getPaymentSlip
);

// RECEIVE DEVICE

router.patch(
  "/:id/receive",
  validateRequest(orderIdSchema),
  adminOrderController.receiveOrder
);

// DELETE ORDER

router.delete(
  "/:id",
  validateRequest(orderIdSchema),
  adminOrderController.deleteOrder
);

export default router;