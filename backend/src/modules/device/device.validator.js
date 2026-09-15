import { z } from "zod";

/**
 * CREATE DEVICE
 * Used with validateRequest()
 * Validates req.body
 */
export const createDeviceSchema = z.object({
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

  color: z
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

  imei1: z
    .string()
    .trim()
    .regex(
      /^\d{15}$/,
      "IMEI1 must contain exactly 15 digits."
    ),

  imei2: z
    .string()
    .trim()
    .length(
      15,
      "IMEI2 must be 15 digits."
    )
    .optional(),

  serialNumber: z
    .string()
    .trim()
    .optional(),

  // BASE DEVICE VALUATION

  valuationPrice: z
    .coerce
    .number()
    .min(0)
    .optional(),

  purchasePrice: z
    .coerce
    .number()
    .min(0)
    .optional(),

  expectedSellingPrice: z
    .coerce
    .number()
    .min(0)
    .optional(),

  customer: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid customer ID."
    )
    .optional(),

  pickupAgent: z
    .string()
    .optional(),

  inspectionAgent: z
    .string()
    .optional(),
});


/**
 * DEVICE ID
 * Used with validateParams()
 * Validates req.params
 */
export const deviceIdSchema = z.object({
  id: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid device ID."
    ),
});


/**
 * UPDATE DEVICE
 * Used with validateRequest()
 * Validates req.body
 */
export const updateDeviceSchema = z.object({
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

  color: z
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

  imei1: z
    .string()
    .trim()
    .regex(
      /^\d{15}$/,
      "IMEI1 must contain exactly 15 digits."
    )
    .optional(),

  imei2: z
    .string()
    .trim()
    .length(
      15,
      "IMEI2 must be 15 digits."
    )
    .optional(),

  serialNumber: z
    .string()
    .trim()
    .optional(),

  // BASE DEVICE VALUATION

  valuationPrice: z
    .coerce
    .number()
    .min(0)
    .optional(),

  purchasePrice: z
    .coerce
    .number()
    .min(0)
    .optional(),

  expectedSellingPrice: z
    .coerce
    .number()
    .min(0)
    .optional(),

  customer: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid customer ID."
    )
    .optional(),

  pickupAgent: z
    .string()
    .optional(),

  inspectionAgent: z
    .string()
    .optional(),
});


/**
 * UPDATE DEVICE STATUS
 * Used with validateRequest()
 * Validates req.body
 */
export const updateDeviceStatusSchema = z.object({
  status: z.enum([
    "pending_pickup",
    "picked_up",
    "in_transit",
    "received_in_shop",
    "inspection_pending",
    "inspection_completed",
    "approved",
    "rejected",
    "inventory",
    "listed",
    "sold",
    "returned",
  ]),
});


/**
 * VERIFY IMEI
 * Used with validateRequest()
 * Validates req.body
 */
export const verifyIMEISchema = z.object({
  imei: z
    .string()
    .trim()
    .regex(
      /^\d{15}$/,
      "IMEI must contain exactly 15 digits."
    ),
});