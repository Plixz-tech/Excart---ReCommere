import mongoose from "mongoose";

import DeviceCatalog from "../../models/DeviceCatalog.js";

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

  const conditionValue =
    evaluation[conditionType];

  if (
    conditionValue === undefined ||
    conditionValue === null
  ) {
    return undefined;
  }

  // Direct condition value
  // Example:
  // evaluation.batteryHealth = 75
  // evaluation.screenCondition = "Poor"
  if (!conditionKey) {
    return conditionValue;
  }

  // Nested condition value
  // Example:
  // evaluation.functionalTests.camera = true
  // evaluation.accessories.charger = true
  if (
    typeof conditionValue === "object" &&
    !Array.isArray(conditionValue)
  ) {
    return conditionValue[conditionKey];
  }

  // Primitive condition with a conditionKey
  // Example:
  // batteryHealth + batteryHealth
  // screenCondition + screenCondition
  // bodyCondition + bodyCondition
  return conditionValue;
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


  // ARRAY


  if (Array.isArray(actualValue)) {
    if (operator === "contains") {
      const expectedString =
        String(expectedValue)
          .trim()
          .toLowerCase();

      return actualValue.some(
        (item) =>
          String(item)
            .trim()
            .toLowerCase() ===
          expectedString
      );
    }

    if (operator === "equals") {
      return actualValue.some(
        (item) =>
          String(item)
            .trim()
            .toLowerCase() ===
          String(expectedValue)
            .trim()
            .toLowerCase()
      );
    }

    if (operator === "not_equals") {
      return !actualValue.some(
        (item) =>
          String(item)
            .trim()
            .toLowerCase() ===
          String(expectedValue)
            .trim()
            .toLowerCase()
      );
    }

    return false;
  }


  // BOOLEAN


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


  // NUMBER


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


  // STRING


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

    case "contains":
      return actualString.includes(
        expectedString
      );

    default:
      return false;
  }
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

if (
  !mongoose.Types.ObjectId.isValid(
    deviceCatalogId
  )
) {
  throw new ApiError(
    400,
    "Invalid device catalog ID."
  );
}

  // Get the real device from the database.
  // Do not trust device pricing information
  // coming from the frontend.
 const catalogDevice =
  await DeviceCatalog.findOne({
    _id: deviceCatalogId,
    active: true,
  });

if (!catalogDevice) {
  throw new ApiError(
    404,
    "Device catalog item not found."
  );
}

 const numericBasePrice =
  Number(catalogDevice.valuationPrice);

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
  rule.brand !== catalogDevice.brand
) {
  continue;
}

if (
  rule.model &&
  rule.model !== catalogDevice.model
) {
  continue;
}

if (
  rule.variant &&
  rule.variant !== catalogDevice.variant
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
  deviceCatalogId:
    catalogDevice._id,

  basePrice:
    numericBasePrice,

  finalPrice,

  totalAdjustment:
    finalPrice -
    numericBasePrice,

  evaluationConfig:
    catalogDevice.evaluationConfig,

  appliedRules,
};
};