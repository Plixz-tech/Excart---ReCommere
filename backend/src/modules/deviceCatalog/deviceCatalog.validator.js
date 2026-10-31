
import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid device catalog ID."
  );

// SHARED EVALUATION CONFIGURATION

const evaluationSectionSchema = z.object({
  enabled: z.boolean().optional(),
  options: z
    .array(z.string().trim().min(1))
    .optional(),
});

const evaluationConfigSchema = z
  .object({
    // 1. SCREEN CONDITION
    screenCondition: evaluationSectionSchema.optional(),

    // 2. DISPLAY ISSUES
    displayIssues: z
      .object({
        enabled: z.boolean().optional(),
        allowMultiple: z.boolean().optional(),
        options: z
          .array(z.string().trim().min(1))
          .optional(),
      })
      .optional(),

    // 3. BODY CONDITION
    bodyCondition: evaluationSectionSchema.optional(),

    // 4. BATTERY HEALTH
    batteryHealth: z
      .object({
        enabled: z.boolean().optional(),
        inputType: z
          .enum(["percentage", "status", "none"])
          .optional(),
        options: z
          .array(z.string().trim().min(1))
          .optional(),
        supportedBrands: z.array(z.string().trim().min(1)).optional(),
      })
      .optional(),

    // 5. REPAIR / REFURBISHED
    repairHistory: evaluationSectionSchema.optional(),

    // 6. ACCESSORIES
    accessories: z
      .object({
        enabled: z.boolean().optional(),
        allowMultiple: z.boolean().optional(),
        options: z
          .array(z.string().trim().min(1))
          .optional(),
      })
      .optional(),

    // 7. FUNCTIONAL CHECKS
    functionalChecks: evaluationSectionSchema.optional(),

    // BACKWARD COMPATIBILITY
    battery: z
      .enum(["percentage", "status", "none"])
      .optional(),

    biometric: z
      .enum([
        "face_id",
        "touch_id",
        "fingerprint",
        "fingerprint_face",
        "none",
      ])
      .optional(),
  })
  .optional();

// CONDITION DEDUCTIONS

const conditionDeductionSchema = z.object({
  conditionType: z
  .string()
  .trim()
  .min(1, "Condition type is required."),

  name: z
    .string()
    .trim()
    .min(1, "Deduction name is required."),

  amount: z.coerce
    .number()
    .finite("Deduction amount must be a valid number.")
    .min(0, "Deduction amount cannot be negative."),

  active: z.boolean().optional(),
});

const conditionDeductionsSchema = z
  .array(conditionDeductionSchema)
  .optional();

// CREATE DEVICE CATALOG

export const createDeviceCatalogSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(2, "Brand is required."),

  brandImage: z.string().trim().optional(),

  model: z
    .string()
    .trim()
    .min(2, "Model is required."),

  modelImage: z.string().trim().optional(),

  variant: z.string().trim().optional(),

  storage: z.string().trim().optional(),

  ram: z.string().trim().optional(),

  valuationPrice: z.coerce
    .number()
    .finite("Valuation price must be a valid number.")
    .min(0, "Valuation price cannot be negative."),

  agentCommission: z.coerce
    .number()
    .finite("Agent commission must be a valid number.")
    .min(0, "Agent commission cannot be negative.")
    .default(0),

  conditionDeductions: conditionDeductionsSchema,

  evaluationConfig: evaluationConfigSchema,

  active: z.boolean().optional(),
});

// UPDATE DEVICE CATALOG

export const updateDeviceCatalogSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(2)
    .optional(),

  brandImage: z.string().trim().optional(),

  model: z
    .string()
    .trim()
    .min(2)
    .optional(),

  modelImage: z.string().trim().optional(),

  variant: z.string().trim().optional(),

  storage: z.string().trim().optional(),

  ram: z.string().trim().optional(),

  valuationPrice: z.coerce
    .number()
    .finite("Valuation price must be a valid number.")
    .min(0, "Valuation price cannot be negative.")
    .optional(),

  agentCommission: z.coerce
    .number()
    .finite("Agent commission must be a valid number.")
    .min(0, "Agent commission cannot be negative.")
    .optional(),

  conditionDeductions: conditionDeductionsSchema,

  evaluationConfig: evaluationConfigSchema,

  active: z.boolean().optional(),
});

// DEVICE CATALOG ID

export const deviceCatalogIdSchema = z.object({
  id: objectId,
});

// FIND MATCHING DEVICE

export const findMatchingDeviceCatalogSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(1, "Brand is required."),

  model: z
    .string()
    .trim()
    .min(1, "Model is required."),

  variant: z.string().trim().optional(),
});