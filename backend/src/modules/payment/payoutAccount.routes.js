import express from "express";

import {
  createPayoutAccountController,
  verifyPayoutAccountController,
  registerCashfreeBeneficiaryController,
} from "./payoutAccount.controller.js";

import protect from "../../middlewares/auth/protect.js";

const router = express.Router();

// CREATE PAYOUT ACCOUNT
router.post(
  "/",
  protect,
  createPayoutAccountController
);

// VERIFY PAYOUT ACCOUNT
router.post(
  "/:payoutAccountId/verify",
  protect,
  verifyPayoutAccountController
);

// REGISTER CASHFREE BENEFICIARY
router.post(
  "/:payoutAccountId/cashfree",
  protect,
  registerCashfreeBeneficiaryController
);

export default router;