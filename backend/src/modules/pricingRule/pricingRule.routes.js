import express from "express";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

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

// ADMIN ONLY
// CREATE PRICING RULE
router.post(
  "/",
  authorize("admin"),
  createPricingRuleController
);

// ADMIN ONLY
// GET ACTIVE PRICING RULES
router.get(
  "/",
  authorize("admin"),
  getActivePricingRulesController
);

// CALCULATE PRICE
// Any authenticated user can calculate
router.post(
  "/calculate",
  calculatePriceController
);

// ADMIN ONLY
// UPDATE PRICING RULE
router.patch(
  "/:id",
  authorize("admin"),
  updatePricingRuleController
);

// ADMIN ONLY
// DELETE PRICING RULE
router.delete(
  "/:id",
  authorize("admin"),
  deletePricingRuleController
);

export default router;