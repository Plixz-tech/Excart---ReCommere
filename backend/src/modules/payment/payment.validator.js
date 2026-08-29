import Joi from "joi";

export const updatePaymentValidator = Joi.object({
  paymentMethod: Joi.string()
    .valid(
      "bank_transfer",
      "upi",
      "cash",
      "other"
    )
    .optional(),

  transactionId: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow(""),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(""),

  estimatedAmount: Joi.number()
    .min(0)
    .optional(),

  finalAmount: Joi.number()
    .min(0)
    .optional(),

  status: Joi.string()
    .valid(
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled"
    )
    .optional(),

  paidAt: Joi.date()
    .optional()
    .allow(null),
});


export const completePaymentValidator =
  Joi.object({
    paymentMethod: Joi.string()
      .valid(
        "bank_transfer",
        "upi",
        "cash",
        "other"
      )
      .required(),

    transactionId: Joi.string()
      .trim()
      .max(100)
      .required(),

    finalAmount: Joi.number()
      .min(0.01)
      .required(),

    notes: Joi.string()
      .trim()
      .max(500)
      .optional()
      .allow(""),
  });


export const failPaymentValidator =
  Joi.object({
    transactionId: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow(""),

    notes: Joi.string()
      .trim()
      .max(500)
      .required(),
  });