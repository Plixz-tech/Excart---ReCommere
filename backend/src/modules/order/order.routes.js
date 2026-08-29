import express from "express";

import orderController from "./order.controller.js";

import {
  createOrderSchema,
  orderIdSchema,
} from "./order.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import protect from "../../middlewares/auth/protect.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.use(protect);

// CREATE ORDER

router.post(
  "/",
  validateRequest(createOrderSchema),
  orderController.createOrder
);

// GET MY ORDERS

router.get(
  "/",
  orderController.getMyOrders
);

// GET MY ORDER

router.get(
  "/:id",
  validateRequest(orderIdSchema),
  orderController.getMyOrderById
);

// CANCEL ORDER

router.patch(
  "/:id/cancel",
  validateRequest(orderIdSchema),
  orderController.cancelOrder
);

// UPLOAD DEVICE INVOICE

router.post(
  "/:id/device-invoice",
  validateRequest(orderIdSchema),
  upload.single("invoice"),
  orderController.uploadDeviceInvoice
);

export default router;