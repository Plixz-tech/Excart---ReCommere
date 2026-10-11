import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid device catalog ID."
  );

// CREATE DEVICE CATALOG

// Validates req.body

export const createDeviceCatalogSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(2, "Brand is required."),

  brandImage: z
    .string()
    .trim()
    .optional(),

  model: z
    .string()
    .trim()
    .min(2, "Model is required."),

  modelImage: z
    .string()
    .trim()
    .optional(),

  variant: z
    .string()
    .trim()
    .optional(),

  storage: z
    .string()
    .trim()
    .optional(),

  ram: z
    .string()
    .trim()
    .optional(),

  valuationPrice: z
    .coerce
    .number()
    .min(
      0,
      "Valuation price cannot be negative."
    ),

  agentCommission: z
    .coerce
    .number()
    .min(
      0,
      "Agent commission cannot be negative."
    )
    .default(0),

  evaluationConfig: z
    .object({
      battery: z
        .enum([
          "percentage",
          "status",
          "none",
        ])
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
    .optional(),

  active: z
    .boolean()
    .optional(),
});

// UPDATE DEVICE CATALOG

// Validates req.body

export const updateDeviceCatalogSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(2)
    .optional(),

  brandImage: z
    .string()
    .trim()
    .optional(),

  model: z
    .string()
    .trim()
    .min(2)
    .optional(),

  modelImage: z
    .string()
    .trim()
    .optional(),

  variant: z
    .string()
    .trim()
    .optional(),

  storage: z
    .string()
    .trim()
    .optional(),

  ram: z
    .string()
    .trim()
    .optional(),

  valuationPrice: z
    .coerce
    .number()
    .min(
      0,
      "Valuation price cannot be negative."
    )
    .optional(),

  agentCommission: z
    .coerce
    .number()
    .min(
      0,
      "Agent commission cannot be negative."
    )
    .optional(),

  evaluationConfig: z
    .object({
      battery: z
        .enum([
          "percentage",
          "status",
          "none",
        ])
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
    .optional(),

  active: z
    .boolean()
    .optional(),
});

// DEVICE CATALOG ID

// Validates req.params

export const deviceCatalogIdSchema = z.object({
  id: objectId,
});

// FIND MATCHING DEVICE

// Validates req.query

export const findMatchingDeviceCatalogSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(1, "Brand is required."),

  model: z
    .string()
    .trim()
    .min(1, "Model is required."),

  variant: z
    .string()
    .trim()
    .optional(),
});