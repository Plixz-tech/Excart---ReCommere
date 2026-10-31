import test from "node:test";
import assert from "node:assert/strict";
import { calculateConditionDeductions } from "../modules/pricingRule/pricingCalculation.js";

const deduction = (conditionType, name, amount, active = true) => ({
  conditionType, name, amount, active,
});

test("returns the base price when no deduction matches", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: { screenCondition: "Excellent" },
    conditionDeductions: [deduction("screenCondition", "Poor", 500)],
  });
  assert.equal(result.finalPrice, 55000);
  assert.equal(result.totalAdjustment, 0);
  assert.equal(result.appliedRules.length, 0);
});

test("applies matching single-select deductions case-insensitively", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: { screenCondition: "gOoD" },
    conditionDeductions: [deduction("screenCondition", "Good", 500)],
  });
  assert.equal(result.finalPrice, 54500);
  assert.equal(result.totalAdjustment, -500);
  assert.equal(result.appliedRules.length, 1);
});

test("adds multiple selected category deductions", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: {
      screenCondition: "Good",
      displayIssues: ["Light spots", "Flickering"],
    },
    conditionDeductions: [
      deduction("screenCondition", "Good", 500),
      deduction("displayIssues", "Light spots", 500),
      deduction("displayIssues", "Flickering", 1000),
      deduction("displayIssues", "Yellow tint", 500),
    ],
  });
  assert.equal(result.finalPrice, 53000);
  assert.equal(result.totalAdjustment, -2000);
  assert.equal(result.appliedRules.length, 3);
});

test("functional checks deduct only when the check fails", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: { functionalChecks: { Camera: true, Microphone: false } },
    conditionDeductions: [
      deduction("functionalChecks", "Camera", 500),
      deduction("functionalChecks", "Microphone", 500),
    ],
  });
  assert.equal(result.finalPrice, 54500);
  assert.deepEqual(result.appliedRules.map((rule) => rule.name), ["Microphone"]);
});

test("supports legacy functionalTests evaluation key", () => {
  const result = calculateConditionDeductions({
    basePrice: 1000,
    evaluation: { functionalTests: { Camera: false } },
    conditionDeductions: [deduction("functionalChecks", "Camera", 100)],
  });
  assert.equal(result.finalPrice, 900);
});

test("does not apply inactive or uncategorized deductions", () => {
  const result = calculateConditionDeductions({
    basePrice: 1000,
    evaluation: { screenCondition: "Poor" },
    conditionDeductions: [
      deduction("screenCondition", "Poor", 100, false),
      { name: "Poor", amount: 200, active: true },
    ],
  });
  assert.equal(result.finalPrice, 1000);
  assert.equal(result.appliedRules.length, 0);
});

test("never returns a negative final price", () => {
  const result = calculateConditionDeductions({
    basePrice: 100,
    evaluation: { screenCondition: "Poor", bodyCondition: "Poor" },
    conditionDeductions: [
      deduction("screenCondition", "Poor", 150),
      deduction("bodyCondition", "Poor", 200),
    ],
  });
  assert.equal(result.finalPrice, 0);
  assert.equal(result.totalAdjustment, -100);
});

test("rejects an invalid base price", () => {
  assert.throws(
    () => calculateConditionDeductions({ basePrice: -1, conditionDeductions: [] }),
    /finite, non-negative number/,
  );
});
test("deducts only missing accessories", () => {
  const result = calculateConditionDeductions({
    basePrice: 50000,
    evaluation: {
      accessories: ["Charger", "Original box"],
    },
    conditionDeductions: [
      deduction("accessories", "Charger", 500),
      deduction("accessories", "Earphones", 500),
      deduction("accessories", "Original box", 500),
      deduction("accessories", "Bill / Invoice", 500),
    ],
  });

  assert.equal(result.finalPrice, 49000);
  assert.deepEqual(
    result.appliedRules.map((rule) => rule.name),
    ["Earphones", "Bill / Invoice"],
  );
});

test("deducts all accessories when none are selected", () => {
  const result = calculateConditionDeductions({
    basePrice: 50000,
    evaluation: { accessories: [] },
    conditionDeductions: [
      deduction("accessories", "Charger", 500),
      deduction("accessories", "Earphones", 500),
    ],
  });

  assert.equal(result.finalPrice, 49000);
  assert.equal(result.appliedRules.length, 2);
});

test("does not deduct accessories when all are selected", () => {
  const result = calculateConditionDeductions({
    basePrice: 50000,
    evaluation: {
      accessories: ["Charger", "Earphones"],
    },
    conditionDeductions: [
      deduction("accessories", "Charger", 500),
      deduction("accessories", "Earphones", 500),
    ],
  });

  assert.equal(result.finalPrice, 50000);
  assert.equal(result.appliedRules.length, 0);
});
