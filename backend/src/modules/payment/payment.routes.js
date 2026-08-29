import express from "express";

import * as paymentController from "./payment.controller.js";

import {
  updatePaymentValidator,
  completePaymentValidator,
  failPaymentValidator,
} from "./payment.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import protect from "../../middlewares/auth/protect.js";

import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

router.use(
  protect,
  authorize("admin")
);

// GET ALL PAYMENTS

router.get(
  "/",
  paymentController.getPayments
);

// GET PAYMENT BY ORDER ID

router.get(
  "/:orderId",
  paymentController.getPaymentByOrderId
);

// UPDATE PAYMENT

router.patch(
  "/:orderId",
  validateRequest(updatePaymentValidator),
  paymentController.updatePayment
);

// COMPLETE PAYMENT

router.patch(
  "/:orderId/complete",
  validateRequest(completePaymentValidator),
  paymentController.completePayment
);

// FAIL PAYMENT

router.patch(
  "/:orderId/fail",
  validateRequest(failPaymentValidator),
  paymentController.failPayment
);

export default router;