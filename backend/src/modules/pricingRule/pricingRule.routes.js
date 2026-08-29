import express from "express";

import protect from "../../middlewares/auth/protect.js";

import {
  createPricingRuleController,
  getActivePricingRulesController,
  updatePricingRuleController,
  deletePricingRuleController,
  calculatePriceController,
} from "./pricingRule.controller.js";

const router = express.Router();

// All pricing-rule endpoints require authentication
router.use(protect);

// CREATE PRICING RULE
router.post(
  "/",
  createPricingRuleController
);

// GET ACTIVE PRICING RULES
router.get(
  "/",
  getActivePricingRulesController
);

// CALCULATE PRICE
router.post(
  "/calculate",
  calculatePriceController
);

// UPDATE PRICING RULE
router.patch(
  "/:id",
  updatePricingRuleController
);

// DELETE PRICING RULE
router.delete(
  "/:id",
  deletePricingRuleController
);

export default router;