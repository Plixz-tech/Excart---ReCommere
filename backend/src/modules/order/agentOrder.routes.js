import express from "express";

import agentOrderController from "./agentOrder.controller.js";

import protect from "../../middlewares/auth/protect.js";

import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import validateParams from "../../middlewares/validation/validateParams.js";

import upload from "../../middlewares/upload.js";

import {
  orderIdSchema,
  agentPickupSchema,
  pickupVerificationSchema,
  sendCustomerAadhaarOtpSchema,
  verifyCustomerAadhaarOtpSchema,
  agentDeviceConditionSchema,
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

router.patch(
  "/:id/device-condition",
  validateParams(orderIdSchema),
  validateRequest(agentDeviceConditionSchema),
  agentOrderController.updateDeviceCondition
);

// CALCULATE DEVICE VALUATION

router.post(
  "/:id/calculate-valuation",
  validateParams(orderIdSchema),
  agentOrderController.calculateDeviceValuation
);

router.post(
  "/:id/device-photos",
  validateParams(orderIdSchema),
  upload.array("photos", 8),
  agentOrderController.uploadDevicePhotos
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

// UPLOAD PICKUP DOCUMENTS

router.post(
  "/:id/pickup-documents",
  validateParams(orderIdSchema),
  upload.fields([
    { name: "customerPhoto", maxCount: 1 },
    { name: "aadhaarDocument", maxCount: 1 },
  ]),
  agentOrderController.uploadPickupDocuments
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