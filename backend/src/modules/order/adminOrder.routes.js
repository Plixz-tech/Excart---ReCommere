import express from "express";

import adminOrderController from "./adminOrder.controller.js";

import {
  updateOrderSchema,
  orderIdSchema,
  orderStatusSchema,
  assignOrderSchema,
} from "./order.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";
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
  validateParams(orderIdSchema),
  adminOrderController.getOrderById
);

// UPDATE ORDER

router.patch(
  "/:id",
  validateParams(orderIdSchema),
  validateRequest(updateOrderSchema),
  adminOrderController.updateOrder
);

// UPDATE ORDER STATUS

router.patch(
  "/:id/status",
  validateParams(orderIdSchema),
  validateRequest(orderStatusSchema),
  adminOrderController.updateOrderStatus
);

// ASSIGN ORDER

router.patch(
  "/:id/assign",
  validateParams(orderIdSchema),
  validateRequest(assignOrderSchema),
  adminOrderController.assignOrder
);

// GET PURCHASE INVOICE

router.get(
  "/:id/purchase-invoice",
  validateParams(orderIdSchema),
  adminOrderController.getPurchaseInvoice
);

// GET PAYMENT SLIP

router.get(
  "/:id/payment-slip",
  validateParams(orderIdSchema),
  adminOrderController.getPaymentSlip
);

// RECEIVE DEVICE

router.patch(
  "/:id/receive",
  validateParams(orderIdSchema),
  adminOrderController.receiveOrder
);

// DELETE ORDER

router.delete(
  "/:id",
  validateParams(orderIdSchema),
  adminOrderController.deleteOrder
);

export default router;