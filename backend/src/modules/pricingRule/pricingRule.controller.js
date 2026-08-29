import ApiError from "../../utils/errors/ApiError.js";

import {
  createPricingRule,
  getActivePricingRules,
  updatePricingRule,
  deletePricingRule,
  calculatePrice,
} from "./pricingRule.service.js";


// CREATE PRICING RULE

export const createPricingRuleController =
  async (req, res, next) => {
    try {
      const rule =
        await createPricingRule(
          req.body,
          req.user?.userId
        );

      return res.status(201).json({
        success: true,
        message:
          "Pricing rule created successfully.",
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  };


// GET ACTIVE PRICING RULES

export const getActivePricingRulesController =
  async (req, res, next) => {
    try {
      const rules =
        await getActivePricingRules();

      return res.status(200).json({
        success: true,
        message:
          "Pricing rules fetched successfully.",
        data: rules,
      });
    } catch (error) {
      next(error);
    }
  };


// UPDATE PRICING RULE

export const updatePricingRuleController =
  async (req, res, next) => {
    try {
      const rule =
        await updatePricingRule(
          req.params.id,
          req.body,
          req.user?.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Pricing rule updated successfully.",
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  };


// DELETE PRICING RULE

export const deletePricingRuleController =
  async (req, res, next) => {
    try {
      const result =
        await deletePricingRule(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        message:
          result.message,
      });
    } catch (error) {
      next(error);
    }
  };


// CALCULATE PRICE

export const calculatePriceController =
  async (req, res, next) => {
    try {
      const {
        deviceId,
        evaluation,
      } = req.body;

      if (!deviceId) {
        throw new ApiError(
          400,
          "Device ID is required."
        );
      }

      const result =
        await calculatePrice({
          deviceId,
          evaluation,
        });

      return res.status(200).json({
        success: true,
        message:
          "Price calculated successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };