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

router.get(
  "/",
  adminOrderController.getOrders
);

router.get(
  "/:id",
  validateRequest(orderIdSchema),
  adminOrderController.getOrderById
);

router.patch(
  "/:id",
  validateRequest(updateOrderSchema),
  adminOrderController.updateOrder
);

router.patch(
  "/:id/status",
  validateRequest(orderStatusSchema),
  adminOrderController.updateOrderStatus
);

router.patch(
  "/:id/assign",
  validateRequest(assignOrderSchema),
  adminOrderController.assignOrder
);

router.patch(
  "/:id/payment",
  adminOrderController.processPayment
);

router.patch(
  "/:id/receive",
  adminOrderController.receiveOrder
);

router.delete(
  "/:id",
  validateRequest(orderIdSchema),
  adminOrderController.deleteOrder
);



export default router;