import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

/**
 * Create Order
 */
export const createOrderSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required."),

  model: z.string().trim().min(1, "Model is required."),

  variant: z.string().trim().optional(),

  color: z.string().trim().optional(),

  storage: z.string().trim().optional(),

  ram: z.string().trim().optional(),

  imei1: z
    .string()
    .trim()
    .regex(/^\d{15}$/, "IMEI1 must contain exactly 15 digits."),

  imei2: z
    .string()
    .trim()
    .regex(/^\d{15}$/, "IMEI2 must contain exactly 15 digits.")
    .optional(),

  serialNumber: z
    .string()
    .trim()
    .optional(),

  customerEvaluation: z
    .object({
      screenCondition: z
        .string()
        .trim()
        .optional(),

      displayIssues: z
        .array(z.string().trim())
        .optional(),

      bodyCondition: z
        .string()
        .trim()
        .optional(),

      batteryHealth: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .nullable(),

      repairHistory: z
        .string()
        .trim()
        .optional(),

      accessories: z
        .array(z.string().trim())
        .optional(),

      functionalIssues: z
        .array(z.string().trim())
        .optional(),

      imeiVerification: z
        .object({
          verified: z.boolean().optional(),
          verifiedAt: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  photos: z
    .array(
      z.object({
        url: z.string().min(1),
        publicId: z.string().optional(),
      })
    )
    .optional(),

  pickup: z
    .object({
      scheduledDate: z.string().optional(),

      scheduledTime: z.string().optional(),

      address: z
        .object({
          line1: z.string().min(1).max(200),
          city: z.string().min(1).max(100),
          state: z.string().min(1).max(100),
          pinCode: z.string().min(4).max(10),

          latitude: z.number().optional().nullable(),

          longitude: z.number().optional().nullable(),
        })
        .optional(),

      notes: z
        .string()
        .max(1000)
        .optional(),
    })
    .optional(),

  estimatedAmount: z
    .number()
    .min(0)
    .optional(),

  notes: z
    .string()
    .max(1000)
    .optional(),
});

/**
 * Update Order
 */
export const updateOrderSchema = z.object({
  device: objectId
    .optional()
    .nullable(),

  pickup: z
    .object({
      status: z
        .enum([
          "pending",
          "assigned",
          "scheduled",
          "in_progress",
          "completed",
          "cancelled",
        ])
        .optional(),

      scheduledDate: z
        .string()
        .optional(),

      scheduledTime: z
        .string()
        .optional(),

      address: z
        .object({
          line1: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          pinCode: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
        .optional(),

      notes: z
        .string()
        .max(1000)
        .optional(),
    })
    .optional(),

  estimatedAmount: z
    .number()
    .min(0)
    .optional(),

  finalAmount: z
    .number()
    .min(0)
    .optional(),

  notes: z
    .string()
    .max(1000)
    .optional(),
});

/**
 * Order ID
 */
export const orderIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Update Order Status
 */
export const orderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "assigned",
    "pickup_scheduled",
    "payment_pending",
    "payment_completed",
    "in_transit",
    "inspection_pending",
    "inspection_in_progress",
    "inspection_completed",
    "completed",
    "cancelled",
    "rejected",
  ]),
});
export const assignOrderSchema = z.object({
  agentId: objectId,
});

export const processPaymentSchema = {
  body: {
    finalAmount: {
      type: "number",
      required: true,
    },

    paymentMethod: {
      type: "string",
      required: true,
    },

    transactionId: {
      type: "string",
      required: false,
    },

    notes: {
      type: "string",
      required: false,
    },
  },
};

export const agentPickupSchema = z.object({
  status: z.enum(["picked_up"], {
    message: "Pickup status must be picked_up.",
  }),
});