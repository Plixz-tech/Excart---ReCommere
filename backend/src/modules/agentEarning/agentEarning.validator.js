import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

const earningStatus = z.enum([
  "pending",
  "approved",
  "paid",
  "cancelled",
]);

export const earningIdSchema = z.object({
  id: objectId,
});

export const earningListSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),

  status: earningStatus.optional(),

  agent: objectId.optional(),
});

export const payEarningSchema = z.object({
  paymentReference: z
    .string()
    .trim()
    .min(1, "Payment reference is required.")
    .max(200, "Payment reference is too long."),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long.")
    .optional(),
});

export const cancelEarningSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long.")
    .optional(),
});