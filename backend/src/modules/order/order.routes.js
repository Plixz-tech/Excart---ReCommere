import express from "express";

import orderController from "./order.controller.js";

import {
  createOrderSchema,
  orderIdSchema,
  reschedulePickupSchema,
} from "./order.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

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
  validateParams(orderIdSchema),
  orderController.getMyOrderById
);


// CANCEL ORDER


router.patch(
  "/:id/cancel",
  validateParams(orderIdSchema),
  orderController.cancelOrder
);


// RESCHEDULE PICKUP


router.patch(
  "/:id/reschedule",
  validateParams(orderIdSchema),
  validateRequest(reschedulePickupSchema),
  orderController.reschedulePickup
);


// UPLOAD DEVICE INVOICE


router.post(
  "/:id/device-invoice",
  validateParams(orderIdSchema),
  upload.single("invoice"),
  orderController.uploadDeviceInvoice
);

export default router;