import express from "express";

import {
  getPayoutAccountController,
  createPayoutAccountController,
  verifyPayoutAccountController,
  registerCashfreeBeneficiaryController,
} from "./payoutAccount.controller.js";

import protect from "../../middlewares/auth/protect.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

import {
  createPayoutAccountSchema,
  payoutAccountIdSchema,
} from "./payoutAccount.validator.js";

const router = express.Router();

// All payout account routes require authentication.
router.use(protect);

// GET PAYOUT ACCOUNT

router.get(
  "/",
  getPayoutAccountController
);

// CREATE PAYOUT ACCOUNT
router.post(
  "/",
  validateRequest(createPayoutAccountSchema),
  createPayoutAccountController
);

// VERIFY PAYOUT ACCOUNT
router.post(
  "/:payoutAccountId/verify",
  validateParams(payoutAccountIdSchema),
  verifyPayoutAccountController
);

// REGISTER CASHFREE BENEFICIARY
router.post(
  "/:payoutAccountId/cashfree",
  validateParams(payoutAccountIdSchema),
  registerCashfreeBeneficiaryController
);

export default router;