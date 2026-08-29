import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid device catalog ID."
  );

// CREATE DEVICE CATALOG

export const createDeviceCatalogSchema =
  z.object({
    body: z.object({
      brand: z
        .string()
        .trim()
        .min(2, "Brand is required."),

      model: z
        .string()
        .trim()
        .min(2, "Model is required."),

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

      active: z
        .boolean()
        .optional(),
    }),
  });

// UPDATE DEVICE CATALOG

export const updateDeviceCatalogSchema =
  z.object({
    params: z.object({
      id: objectId,
    }),

    body: z.object({
      brand: z
        .string()
        .trim()
        .min(2)
        .optional(),

      model: z
        .string()
        .trim()
        .min(2)
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

      active: z
        .boolean()
        .optional(),
    }),
  });

// DEVICE CATALOG ID

export const deviceCatalogIdSchema =
  z.object({
    params: z.object({
      id: objectId,
    }),
  });

// FIND MATCHING DEVICE

export const findMatchingDeviceCatalogSchema =
  z.object({
    query: z.object({
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
    }),
  });