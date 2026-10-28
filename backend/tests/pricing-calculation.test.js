
import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateConditionDeductions,
} from "../src/modules/pricingRule/pricingCalculation.js";

const deductions = [
  { conditionType: "screenCondition", name: "Good", amount: 500, active: true },
  { conditionType: "batteryHealth", name: "84–80%", amount: 1000, active: true },
  { conditionType: "functionalChecks", name: "Camera", amount: 700, active: true },
  { conditionType: "functionalChecks", name: "Microphone", amount: 300, active: true },
  { conditionType: "screenCondition", name: "Poor", amount: 2000, active: false },
];

test("no matching deductions keeps the base price", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: { screenCondition: "Excellent" },
    conditionDeductions: deductions,
  });

  assert.equal(result.finalPrice, 55000);
  assert.equal(result.totalAdjustment, 0);
  assert.equal(result.appliedRules.length, 0);
});

test("matches a selected condition and deducts its amount", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: { screenCondition: "Good" },
    conditionDeductions: deductions,
  });

  assert.equal(result.finalPrice, 54500);
  assert.equal(result.totalAdjustment, -500);
  assert.equal(result.appliedRules.length, 1);
});

test("accumulates multiple matching deductions", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: {
      screenCondition: "Good",
      batteryHealth: "84–80%",
    },
    conditionDeductions: deductions,
  });

  assert.equal(result.finalPrice, 53500);
  assert.equal(result.totalAdjustment, -1500);
  assert.equal(result.appliedRules.length, 2);
});

test("functional checks deduct only when a check fails", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: {
      functionalChecks: {
        Camera: true,
        Microphone: false,
      },
    },
    conditionDeductions: deductions,
  });

  assert.equal(result.finalPrice, 54700);
  assert.equal(result.appliedRules.length, 1);
  assert.equal(result.appliedRules[0].name, "Microphone");
});

test("supports the legacy functionalTests field", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: {
      functionalTests: {
        Camera: false,
      },
    },
    conditionDeductions: deductions,
  });

  assert.equal(result.finalPrice, 54300);
  assert.equal(result.appliedRules.length, 1);
});

test("ignores inactive deductions", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: { screenCondition: "Poor" },
    conditionDeductions: deductions,
  });

  assert.equal(result.finalPrice, 55000);
  assert.equal(result.appliedRules.length, 0);
});

test("does not allow the final price to become negative", () => {
  const result = calculateConditionDeductions({
    basePrice: 500,
    evaluation: { screenCondition: "Good" },
    conditionDeductions: [
      { conditionType: "screenCondition", name: "Good", amount: 1000, active: true },
    ],
  });

  assert.equal(result.finalPrice, 0);
  assert.equal(result.totalAdjustment, -500);
});

test("rejects a negative base price", () => {
  assert.throws(
    () =>
      calculateConditionDeductions({
        basePrice: -1,
        evaluation: {},
        conditionDeductions: [],
      }),
    /Base price must be a finite, non-negative number/,
  );
});
