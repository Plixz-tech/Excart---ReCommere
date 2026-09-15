import express from "express";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

import {
  createPricingRuleSchema,
  calculatePriceSchema,
  updatePricingRuleSchema,
  pricingRuleIdSchema,
} from "./pricingRule.validator.js";

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
  validateRequest(createPricingRuleSchema),
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
  validateRequest(calculatePriceSchema),
  calculatePriceController
);

// ADMIN ONLY
// UPDATE PRICING RULE

router.patch(
  "/:id",
  authorize("admin"),
  validateParams(pricingRuleIdSchema),
  validateRequest(updatePricingRuleSchema),
  updatePricingRuleController
);

// ADMIN ONLY
// DELETE PRICING RULE

router.delete(
  "/:id",
  authorize("admin"),
  validateParams(pricingRuleIdSchema),
  deletePricingRuleController
);

export default router;