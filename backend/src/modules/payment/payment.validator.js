import { z } from "zod";

export const updatePaymentValidator = z.object({
  paymentMethod: z
    .enum([
      "bank_transfer",
      "upi",
      "cash",
      "other",
    ])
    .optional(),

  transactionId: z
    .string()
    .trim()
    .max(100)
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500)
    .optional(),

  estimatedAmount: z
    .coerce
    .number()
    .min(0)
    .optional(),

  finalAmount: z
    .coerce
    .number()
    .min(0)
    .optional(),

  status: z
    .enum([
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
    ])
    .optional(),

  paidAt: z
    .coerce
    .date()
    .nullable()
    .optional(),
});

export const completePaymentValidator = z.object({
  paymentMethod: z.enum([
    "bank_transfer",
    "upi",
    "cash",
    "other",
  ]),

  transactionId: z
    .string()
    .trim()
    .max(100)
    .optional(),

  finalAmount: z
    .coerce
    .number()
    .positive(
      "Final payment amount must be greater than 0."
    ),

  notes: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export const failPaymentValidator = z.object({
  transactionId: z
    .string()
    .trim()
    .max(100)
    .optional(),

  notes: z
    .string()
    .trim()
    .min(
      1,
      "Payment failure reason is required."
    )
    .max(500),
});