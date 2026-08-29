import mongoose from "mongoose";

import Device from "../../models/Device.js";

import ApiError from "../../utils/errors/ApiError.js";

import * as pricingRuleRepository from "./pricingRule.repository.js";



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



// GET NESTED VALUE


const getConditionValue = (
  evaluation,
  conditionType,
  conditionKey
) => {
  if (!evaluation) {
    return undefined;
  }

  // Example:
  // conditionType = "screenCondition"
  // conditionKey = ""
  //
  // evaluation.screenCondition

  if (!conditionKey) {
    return evaluation[
      conditionType
    ];
  }

  // Example:
  // conditionType = "functionalTests"
  // conditionKey = "camera"
  //
  // evaluation.functionalTests.camera

  return evaluation[
    conditionType
  ]?.[conditionKey];
};



// CHECK RULE CONDITION


const matchesRule = (
  actualValue,
  operator,
  expectedValue
) => {
  if (
    actualValue ===
      undefined ||
    actualValue === null
  ) {
    return false;
  }

  // ---------------------------------------------
  // BOOLEAN
  // ---------------------------------------------

  if (
    expectedValue === "true" ||
    expectedValue === "false"
  ) {
    const expectedBoolean =
      expectedValue === "true";

    const actualBoolean =
      actualValue === true ||
      actualValue === false
        ? actualValue
        : String(actualValue)
            .toLowerCase() ===
          "true";

    switch (operator) {
      case "equals":
        return (
          actualBoolean ===
          expectedBoolean
        );

      case "not_equals":
        return (
          actualBoolean !==
          expectedBoolean
        );

      default:
        return false;
    }
  }

  // ---------------------------------------------
  // NUMBER
  // ---------------------------------------------

  const actualNumber =
    Number(actualValue);

  const expectedNumber =
    Number(expectedValue);

  const bothNumbers =
    !Number.isNaN(
      actualNumber
    ) &&
    !Number.isNaN(
      expectedNumber
    );

  if (bothNumbers) {
    switch (operator) {
      case "equals":
        return (
          actualNumber ===
          expectedNumber
        );

      case "not_equals":
        return (
          actualNumber !==
          expectedNumber
        );

      case "less_than":
        return (
          actualNumber <
          expectedNumber
        );

      case "less_than_or_equal":
        return (
          actualNumber <=
          expectedNumber
        );

      case "greater_than":
        return (
          actualNumber >
          expectedNumber
        );

      case "greater_than_or_equal":
        return (
          actualNumber >=
          expectedNumber
        );

      default:
        return false;
    }
  }

  // ---------------------------------------------
  // STRING
  // ---------------------------------------------

  const actualString =
    String(actualValue)
      .trim()
      .toLowerCase();

  const expectedString =
    String(expectedValue)
      .trim()
      .toLowerCase();

  switch (operator) {
    case "equals":
      return (
        actualString ===
        expectedString
      );

    case "not_equals":
      return (
        actualString !==
        expectedString
      );

    default:
      return false;
  }
};



// CALCULATE PRICE


export const calculatePrice = async ({
  deviceId,
  evaluation,
}) => {
  if (!deviceId) {
    throw new ApiError(
      400,
      "Device ID is required."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      deviceId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid device ID."
    );
  }

  // Get the real device from the database.
  // Do not trust device pricing information
  // coming from the frontend.
  const device =
    await Device.findOne({
      _id: deviceId,
      status: {
        $ne: "deleted",
      },
    });

  if (!device) {
    throw new ApiError(
      404,
      "Device not found."
    );
  }

  const numericBasePrice =
    Number(device.valuationPrice);

  if (
    Number.isNaN(numericBasePrice) ||
    numericBasePrice < 0
  ) {
    throw new ApiError(
      400,
      "Device valuation price is invalid."
    );
  }

  const rules =
    await pricingRuleRepository.findActive();

  let finalPrice =
    numericBasePrice;

  const appliedRules = [];

  for (const rule of rules) {

    // DEVICE MATCHING

    if (
      rule.brand &&
      rule.brand !== device.brand
    ) {
      continue;
    }

    if (
      rule.model &&
      rule.model !== device.model
    ) {
      continue;
    }

    if (
      rule.variant &&
      rule.variant !== device.variant
    ) {
      continue;
    }

    // GET ACTUAL CONDITION

    const actualValue =
      getConditionValue(
        evaluation,
        rule.conditionType,
        rule.conditionKey
      );

    // CHECK CONDITION

    const matched =
      matchesRule(
        actualValue,
        rule.operator,
        rule.conditionValue
      );

    if (!matched) {
      continue;
    }

    // APPLY PRICE CHANGE

    if (
      rule.adjustmentType ===
      "deduction"
    ) {
      finalPrice -=
        rule.adjustmentValue;
    }

    if (
      rule.adjustmentType ===
      "addition"
    ) {
      finalPrice +=
        rule.adjustmentValue;
    }

    appliedRules.push({
      ruleId:
        rule._id,

      conditionType:
        rule.conditionType,

      conditionKey:
        rule.conditionKey,

      operator:
        rule.operator,

      conditionValue:
        rule.conditionValue,

      actualValue,

      adjustmentType:
        rule.adjustmentType,

      adjustmentValue:
        rule.adjustmentValue,
    });
  }

  // Never allow negative price.

  finalPrice =
    Math.max(
      0,
      finalPrice
    );

  return {
    deviceId:
      device._id,

    basePrice:
      numericBasePrice,

    finalPrice,

    totalAdjustment:
      finalPrice -
      numericBasePrice,

    appliedRules,
  };
};