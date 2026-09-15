import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId."
  );

export const inspectionIdSchema = z.object({
  id: objectId,
});

export const createInspectionSchema = z.object({
  order: objectId,
  device: objectId,
});

export const updateInspectionSchema = z.object({
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

  functionalTests: z
    .object({
      camera: z.boolean().optional(),
      speaker: z.boolean().optional(),
      microphone: z.boolean().optional(),
      chargingPort: z.boolean().optional(),
      wifi: z.boolean().optional(),
      bluetooth: z.boolean().optional(),
      network: z.boolean().optional(),
      faceId: z.boolean().optional(),
      fingerprint: z.boolean().optional(),
    })
    .optional(),

  accessories: z
    .object({
      charger: z.boolean().optional(),
      cable: z.boolean().optional(),
      box: z.boolean().optional(),
      bill: z.boolean().optional(),
      simEjector: z.boolean().optional(),
    })
    .optional(),

  repairHistory: z
    .object({
      repaired: z.boolean().optional(),
      remarks: z.string().trim().optional(),
    })
    .optional(),

  imeiVerification: z
    .object({
      verified: z.boolean().optional(),
      remarks: z.string().trim().optional(),
    })
    .optional(),

  overallGrade: z
    .enum([
      "A+",
      "A",
      "B",
      "C",
      "D",
    ])
    .optional(),

  estimatedPrice: z.coerce
    .number()
    .min(0)
    .optional(),

  remarks: z.string().trim().optional(),
});

export const completeInspectionSchema = z.object({});

export const updateInspectionStatusSchema = z
  .object({
    status: z.enum([
      "approved",
      "rejected",
    ]),

    reason: z
      .string()
      .trim()
      .min(
        1,
        "Rejection reason is required when rejecting an inspection."
      )
      .max(
        1000,
        "Rejection reason is too long."
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === "rejected" &&
      !data.reason
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message:
          "Rejection reason is required when rejecting an inspection.",
      });
    }
  });