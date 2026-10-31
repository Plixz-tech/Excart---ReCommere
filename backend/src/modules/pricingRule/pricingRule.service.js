import mongoose from "mongoose";
import DeviceCatalog from "../../models/DeviceCatalog.js";
import ApiError from "../../utils/errors/ApiError.js";
import * as pricingRuleRepository from "./pricingRule.repository.js";
import { calculateConditionDeductions } from "./pricingCalculation.js";
// CREATE PRICING RULE
export const createPricingRule = async (
  data,
  userId
) => {
  if (!data.conditionType) {
    throw new ApiError(
      400,
      "Condition type is required."
    );
  }
  if (!data.operator) {
    throw new ApiError(
      400,
      "Operator is required."
    );
  }
  if (
    data.conditionValue ===
    undefined ||
    data.conditionValue === null
  ) {
    throw new ApiError(
      400,
      "Condition value is required."
    );
  }
  if (!data.adjustmentType) {
    throw new ApiError(
      400,
      "Adjustment type is required."
    );
  }
  if (
    data.adjustmentValue ===
    undefined ||
    data.adjustmentValue === null
  ) {
    throw new ApiError(
      400,
      "Adjustment value is required."
    );
  }
  if (
    Number(data.adjustmentValue) < 0
  ) {
    throw new ApiError(
      400,
      "Adjustment value cannot be negative."
    );
  }
  return pricingRuleRepository.create({
    brand:
      data.brand || "",
    model:
      data.model || "",
    variant:
      data.variant || "",
    conditionType:
      data.conditionType,
    conditionKey:
      data.conditionKey || "",
    operator:
      data.operator,
    conditionValue:
      String(data.conditionValue),
    adjustmentType:
      data.adjustmentType,
    adjustmentValue:
      Number(data.adjustmentValue),
    active:
      data.active !== undefined
        ? data.active
        : true,
    createdBy:
      userId || null,
    updatedBy:
      userId || null,
  });
};
// GET ACTIVE PRICING RULES
export const getActivePricingRules =
  async () => {
    return pricingRuleRepository.findActive();
  };
// UPDATE PRICING RULE
export const updatePricingRule = async (
  pricingRuleId,
  data,
  userId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      pricingRuleId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid pricing rule ID."
    );
  }
  const existing =
    await pricingRuleRepository.findById(
      pricingRuleId
    );
  if (!existing) {
    throw new ApiError(
      404,
      "Pricing rule not found."
    );
  }
  const updateData = {
    updatedBy:
      userId || null,
  };
  if (
    data.brand !== undefined
  ) {
    updateData.brand =
      data.brand;
  }
  if (
    data.model !== undefined
  ) {
    updateData.model =
      data.model;
  }
  if (
    data.variant !== undefined
  ) {
    updateData.variant =
      data.variant;
  }
  if (
    data.conditionType !==
    undefined
  ) {
    updateData.conditionType =
      data.conditionType;
  }
  if (
    data.conditionKey !==
    undefined
  ) {
    updateData.conditionKey =
      data.conditionKey;
  }
  if (
    data.operator !==
    undefined
  ) {
    updateData.operator =
      data.operator;
  }
  if (
    data.conditionValue !==
    undefined
  ) {
    updateData.conditionValue =
      String(
        data.conditionValue
      );
  }
  if (
    data.adjustmentType !==
    undefined
  ) {
    updateData.adjustmentType =
      data.adjustmentType;
  }
  if (
    data.adjustmentValue !==
    undefined
  ) {
    if (
      Number(
        data.adjustmentValue
      ) < 0
    ) {
      throw new ApiError(
        400,
        "Adjustment value cannot be negative."
      );
    }
    updateData.adjustmentValue =
      Number(
        data.adjustmentValue
      );
  }
  if (
    data.active !==
    undefined
  ) {
    updateData.active =
      data.active;
  }
  return pricingRuleRepository.updateById(
    pricingRuleId,
    updateData
  );
};
// DELETE PRICING RULE
export const deletePricingRule = async (
  pricingRuleId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      pricingRuleId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid pricing rule ID."
    );
  }
  const existing =
    await pricingRuleRepository.findById(
      pricingRuleId
    );
  if (!existing) {
    throw new ApiError(
      404,
      "Pricing rule not found."
    );
  }
  await pricingRuleRepository.deleteById(
    pricingRuleId
  );
  return {
    message:
      "Pricing rule deleted successfully.",
  };
};

// CALCULATE PRICE

export const calculatePrice = async ({
  deviceCatalogId,
  evaluation,
}) => {
  if (!deviceCatalogId) {
    throw new ApiError(
      400,
      "Device catalog ID is required."
    );
  }

  if (!mongoose.Types.ObjectId.isValid(deviceCatalogId)) {
    throw new ApiError(
      400,
      "Invalid device catalog ID."
    );
  }

  // Always use the catalog stored in the database.
  const catalogDevice = await DeviceCatalog.findOne({
    _id: deviceCatalogId,
    active: true,
  });

  if (!catalogDevice) {
    throw new ApiError(
      404,
      "Device catalog item not found."
    );
  }

  const numericBasePrice = Number(catalogDevice.valuationPrice);

  if (
    !Number.isFinite(numericBasePrice) ||
    numericBasePrice < 0
  ) {
    throw new ApiError(
      400,
      "Device valuation price is invalid."
    );
  }

  // CHANGED: Use the shared helper for deduction calculation.
  const pricingResult = calculateConditionDeductions({
    basePrice: numericBasePrice,
    evaluation,
    conditionDeductions: catalogDevice.conditionDeductions,
    brand: catalogDevice.brand,
    evaluationConfig:
      catalogDevice.evaluationConfig?.toObject?.() ??
      catalogDevice.evaluationConfig?.toJSON?.() ??
      catalogDevice.evaluationConfig ??
      {},
  });

  return {
    deviceCatalogId: catalogDevice._id,
    basePrice: pricingResult.basePrice,
    finalPrice: pricingResult.finalPrice,
    totalAdjustment: pricingResult.totalAdjustment,
    evaluationConfig: catalogDevice.evaluationConfig,
    appliedRules: pricingResult.appliedRules,
  };
};