export const calculateConditionDeductions = ({
  basePrice,
  evaluation,
  conditionDeductions,
}) => {
  const numericBasePrice = Number(basePrice);
  if (!Number.isFinite(numericBasePrice) || numericBasePrice < 0) {
    throw new TypeError("Base price must be a finite, non-negative number.");
  }

  const normalizedEvaluation =
    evaluation && typeof evaluation === "object" && !Array.isArray(evaluation)
      ? evaluation
      : {};
  const deductions = Array.isArray(conditionDeductions)
    ? conditionDeductions
    : [];

  let totalDeductions = 0;
  const appliedRules = [];

  for (const deduction of deductions) {
    if (!deduction || deduction.active === false) continue;

    const conditionType = String(deduction.conditionType || "").trim();
    const deductionName = String(deduction.name || "").trim();
    const amount = Number(deduction.amount);
    if (!conditionType || !deductionName || !Number.isFinite(amount) || amount < 0) {
      continue;
    }

    const typeKey = Object.keys(normalizedEvaluation).find(
      (key) => key.trim().toLowerCase() === conditionType.toLowerCase(),
    );
    let evaluationKey = typeKey;

    // Support both historical and current functional-check field names.
    if (conditionType.toLowerCase() === "functionaltests" &&
        normalizedEvaluation.functionalChecks !== undefined) {
      evaluationKey = "functionalChecks";
    } else if (conditionType.toLowerCase() === "functionalchecks" &&
        normalizedEvaluation.functionalChecks === undefined &&
        normalizedEvaluation.functionalTests !== undefined) {
      evaluationKey = "functionalTests";
    }

    const actualValue = evaluationKey ? normalizedEvaluation[evaluationKey] : undefined;
    let matched = false;
    const isFunctionalCheck = ["functionalchecks", "functionaltests"].includes(
      conditionType.toLowerCase(),
    );
    const normalizedName = deductionName.toLowerCase();

    if (Array.isArray(actualValue)) {
      matched = actualValue.some(
        (value) => String(value).trim().toLowerCase() === normalizedName,
      );
    } else if (actualValue !== null && typeof actualValue === "object") {
      const matchedKey = Object.keys(actualValue).find(
        (key) => key.trim().toLowerCase() === normalizedName,
      );
      if (matchedKey !== undefined) {
        // Functional checks deduct only on failure; other boolean maps deduct on true.
        matched = isFunctionalCheck
          ? actualValue[matchedKey] === false
          : actualValue[matchedKey] === true;
      }
    } else {
      matched = String(actualValue ?? "").trim().toLowerCase() === normalizedName;
    }

    if (!matched) continue;

    totalDeductions += amount;
    appliedRules.push({
      ruleId: "",
      name: deductionName,
      conditionType,
      conditionKey: "",
      operator: "equals",
      conditionValue: deductionName,
      actualValue,
      adjustmentType: "deduction",
      adjustmentValue: amount,
    });
  }

  const finalPrice = Math.max(0, numericBasePrice - totalDeductions);
  return {
    basePrice: numericBasePrice,
    finalPrice,
    totalAdjustment: finalPrice - numericBasePrice,
    appliedRules,
  };
};