
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
    .nullable()
    .optional(),

  bodyCondition: z
    .enum([
      "Excellent",
      "Good",
      "Average",
      "Poor",
    ])
    .nullable()
    .optional(),

  batteryHealth: z.coerce
    .number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),

  functionalTests: z
    .object({
      camera: z.boolean().nullable().optional(),
      speaker: z.boolean().nullable().optional(),
      microphone: z.boolean().nullable().optional(),
      buttons: z.boolean().nullable().optional(),
      touchScreen: z.boolean().nullable().optional(),
      chargingPort: z.boolean().nullable().optional(),
      wifi: z.boolean().nullable().optional(),
      bluetooth: z.boolean().nullable().optional(),
      network: z.boolean().nullable().optional(),
      faceId: z.boolean().nullable().optional(),
      fingerprint: z.boolean().nullable().optional(),
      vibration: z.boolean().nullable().optional(),
      gps: z.boolean().nullable().optional(),
    })
    .optional(),

  accessories: z
    .object({
      charger: z.boolean().optional(),
      cable: z.boolean().optional(),
      earphones: z.boolean().optional(),
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
    .nullable()
    .optional(),


estimatedPrice: z.coerce
  .number()
  .min(0)
  .optional(),

sellingPrice: z.coerce
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
