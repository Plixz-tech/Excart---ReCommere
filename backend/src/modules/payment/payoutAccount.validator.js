import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid payout account ID."
  );

const bankAccountNumberSchema = z
  .string()
  .trim()
  .min(8, "Bank account number is required.")
  .max(20, "Invalid bank account number.");

const bankIfscSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z]{4}0[A-Z0-9]{6}$/,
    "Invalid IFSC code."
  );

const upiIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/,
    "Invalid UPI ID."
  );

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^[6-9]\d{9}$/,
    "Invalid phone number."
  );

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address.");

export const payoutAccountIdSchema = z.object({
  payoutAccountId: objectId,
});

export const createPayoutAccountSchema = z
  .object({
    type: z.enum(["bank", "upi"], {
      message: "Payout account type must be bank or upi.",
    }),

    accountHolderName: z
      .string()
      .trim()
      .min(2, "Account holder name is required.")
      .max(100, "Account holder name is too long."),

    bankAccountNumber:
      bankAccountNumberSchema.optional(),

    bankIfsc:
      bankIfscSchema.optional(),

    upiId:
      upiIdSchema.optional(),

    phone:
      phoneSchema.optional(),

    email:
      emailSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "bank") {
      if (!data.bankAccountNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["bankAccountNumber"],
          message:
            "Bank account number is required for bank payout accounts.",
        });
      }

      if (!data.bankIfsc) {
        ctx.addIssue({
          code: "custom",
          path: ["bankIfsc"],
          message:
            "Bank IFSC is required for bank payout accounts.",
        });
      }
    }

    if (data.type === "upi") {
      if (!data.upiId) {
        ctx.addIssue({
          code: "custom",
          path: ["upiId"],
          message:
            "UPI ID is required for UPI payout accounts.",
        });
      }
    }
  });

export const updatePayoutAccountSchema =
  z.object({
    accountHolderName: z
      .string()
      .trim()
      .min(2, "Account holder name is required.")
      .max(100)
      .optional(),

    bankAccountNumber:
      bankAccountNumberSchema.optional(),

    bankIfsc:
      bankIfscSchema.optional(),

    upiId:
      upiIdSchema.optional(),

    phone:
      phoneSchema.optional(),

    email:
      emailSchema.optional(),
  });