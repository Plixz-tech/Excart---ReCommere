
import test from "node:test";
import assert from "node:assert/strict";

import { calculateConditionDeductions } from "../modules/pricingRule/pricingCalculation.js";

const deduction = (conditionType, name, amount, active = true) => ({
  conditionType,
  name,
  amount,
  active,
});

const deductions = [
  deduction("screenCondition", "Good", 500),
  deduction("batteryHealth", "84–80%", 1000),
  deduction("functionalChecks", "Camera", 700),
  deduction("functionalChecks", "Microphone", 300),
  deduction("screenCondition", "Poor", 2000, false),
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
      deduction("screenCondition", "Good", 1000),
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

test("deducts selected display issues and missing accessories", () => {
  const result = calculateConditionDeductions({
    basePrice: 55000,
    evaluation: {
      displayIssues: ["Light spots", "Flickering"],
      accessories: ["Charger", "Original box"],
    },
    conditionDeductions: [
      deduction("displayIssues", "Light spots", 500),
      deduction("displayIssues", "Flickering", 1000),
      deduction("accessories", "Charger", 300),
      deduction("accessories", "Original box", 200),
      deduction("accessories", "Earphones", 400),
      deduction("accessories", "Bill / Invoice", 600),
    ],
  });

  assert.equal(result.finalPrice, 52500);
  assert.equal(result.totalAdjustment, -2500);
  assert.deepEqual(
    result.appliedRules.map((rule) => rule.name),
    ["Light spots", "Flickering", "Earphones", "Bill / Invoice"],
  );
});

test("does not deduct for selected accessories", () => {
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
    evaluation: {
      accessories: [],
    },
    conditionDeductions: [
      deduction("accessories", "Charger", 500),
      deduction("accessories", "Earphones", 500),
    ],
  });

  assert.equal(result.finalPrice, 49000);
  assert.equal(result.appliedRules.length, 2);
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