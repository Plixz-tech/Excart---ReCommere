import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid pricing rule ID."
  );

const conditionTypeSchema = z.enum([
  "screenCondition",
  "bodyCondition",
  "batteryHealth",
  "functionalTests",
  "accessories",
  "repairHistory",
  "imeiVerification",
  "overallGrade",
]);

const operatorSchema = z.enum([
  "equals",
  "not_equals",
  "less_than",
  "less_than_or_equal",
  "greater_than",
  "greater_than_or_equal",
]);

const adjustmentTypeSchema = z.enum([
  "deduction",
  "addition",
]);

const conditionValueSchema = z.union([
  z.string().trim(),
  z.number(),
  z.boolean(),
]);

// PRICING RULE ID

export const pricingRuleIdSchema = z.object({
  id: objectId,
});

// CREATE PRICING RULE

export const createPricingRuleSchema = z.object({
  brand: z
    .string()
    .trim()
    .optional(),

  model: z
    .string()
    .trim()
    .optional(),

  variant: z
    .string()
    .trim()
    .optional(),

  conditionType: conditionTypeSchema,

  conditionKey: z
    .string()
    .trim()
    .optional(),

  operator: operatorSchema,

  conditionValue: conditionValueSchema,

  adjustmentType: adjustmentTypeSchema,

  adjustmentValue: z.coerce
    .number()
    .min(
      0,
      "Adjustment value cannot be negative."
    ),

  active: z
    .boolean()
    .optional(),
});

// UPDATE PRICING RULE

export const updatePricingRuleSchema = z.object({
  brand: z
    .string()
    .trim()
    .optional(),

  model: z
    .string()
    .trim()
    .optional(),

  variant: z
    .string()
    .trim()
    .optional(),

  conditionType: conditionTypeSchema
    .optional(),

  conditionKey: z
    .string()
    .trim()
    .optional(),

  operator: operatorSchema
    .optional(),

  conditionValue: conditionValueSchema
    .optional(),

  adjustmentType: adjustmentTypeSchema
    .optional(),

  adjustmentValue: z.coerce
    .number()
    .min(
      0,
      "Adjustment value cannot be negative."
    )
    .optional(),

  active: z
    .boolean()
    .optional(),
});

// CALCULATE PRICE

const functionalTestsSchema = z.object({
  camera: z.boolean().optional(),
  speaker: z.boolean().optional(),
  microphone: z.boolean().optional(),
  chargingPort: z.boolean().optional(),
  wifi: z.boolean().optional(),
  bluetooth: z.boolean().optional(),
  network: z.boolean().optional(),
  faceId: z.boolean().optional(),
  fingerprint: z.boolean().optional(),
});

const accessoriesSchema = z.object({
  charger: z.boolean().optional(),
  cable: z.boolean().optional(),
  box: z.boolean().optional(),
  bill: z.boolean().optional(),
  simEjector: z.boolean().optional(),
});

const repairHistorySchema = z.object({
  repaired: z.boolean().optional(),
  remarks: z.string().trim().optional(),
});

const imeiVerificationSchema = z.object({
  verified: z.boolean().optional(),
  remarks: z.string().trim().optional(),
});

export const calculatePriceSchema = z.object({
  deviceId: objectId,

  evaluation: z
    .object({
      screenCondition: z
        .enum([
          "Excellent",
          "Good",
          "Average",
          "Poor",
          "Broken",
        ])
        .optional(),

      bodyCondition: z
        .enum([
          "Excellent",
          "Good",
          "Average",
          "Poor",
        ])
        .optional(),

      batteryHealth: z.coerce
        .number()
        .min(0)
        .max(100)
        .optional(),

      functionalTests:
        functionalTestsSchema.optional(),

      accessories:
        accessoriesSchema.optional(),

      repairHistory:
        repairHistorySchema.optional(),

      imeiVerification:
        imeiVerificationSchema.optional(),

      overallGrade: z
        .enum([
          "A+",
          "A",
          "B",
          "C",
          "D",
        ])
        .optional(),
    })
    .optional(),
});