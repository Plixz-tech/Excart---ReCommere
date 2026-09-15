import express from "express";

import agentOrderController from "./agentOrder.controller.js";

import protect from "../../middlewares/auth/protect.js";

import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import validateParams from "../../middlewares/validation/validateParams.js";

import {
  orderIdSchema,
  agentPickupSchema,
  pickupVerificationSchema,
  sendCustomerAadhaarOtpSchema,
  verifyCustomerAadhaarOtpSchema,
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
  validateParams(orderIdSchema),
  agentOrderController.getMyOrderById
);

// SELF ASSIGN ORDER

router.patch(
  "/:id/self-assign",
  validateParams(orderIdSchema),
  agentOrderController.selfAssignOrder
);

// CUSTOMER AADHAAR - SEND OTP

router.post(
  "/:id/aadhaar/send-otp",
  validateParams(orderIdSchema),
  validateRequest(sendCustomerAadhaarOtpSchema),
  agentOrderController.sendCustomerAadhaarOtp
);

// CUSTOMER AADHAAR - VERIFY OTP

router.post(
  "/:id/aadhaar/verify-otp",
  validateParams(orderIdSchema),
  validateRequest(verifyCustomerAadhaarOtpSchema),
  agentOrderController.verifyCustomerAadhaarOtp
);

// PICKUP VERIFICATION

router.patch(
  "/:id/pickup-verification",
  validateParams(orderIdSchema),
  validateRequest(pickupVerificationSchema),
  agentOrderController.verifyPickup
);

// PICKUP ORDER

router.patch(
  "/:id/pickup",
  validateParams(orderIdSchema),
  validateRequest(agentPickupSchema),
  agentOrderController.pickupOrder
);

export default router;