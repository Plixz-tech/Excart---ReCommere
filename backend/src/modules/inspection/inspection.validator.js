import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");

export const createInspectionSchema = z.object({
  device: objectId,

  screenCondition: z.enum([
    "Excellent",
    "Good",
    "Average",
    "Poor",
    "Broken",
  ]),

  bodyCondition: z.enum([
    "Excellent",
    "Good",
    "Average",
    "Poor",
  ]),

  batteryHealth: z.coerce
    .number()
    .min(0)
    .max(100),

  functionalTests: z.object({
    camera: z.boolean(),
    speaker: z.boolean(),
    microphone: z.boolean(),
    chargingPort: z.boolean(),
    wifi: z.boolean(),
    bluetooth: z.boolean(),
    network: z.boolean(),
    faceId: z.boolean(),
    fingerprint: z.boolean(),
  }),

  accessories: z.object({
    charger: z.boolean(),
    cable: z.boolean(),
    box: z.boolean(),
    bill: z.boolean(),
    simEjector: z.boolean(),
  }),

  repairHistory: z.object({
    repaired: z.boolean(),
    remarks: z.string().trim().optional(),
  }),

  imeiVerification: z.object({
    verified: z.boolean(),
    remarks: z.string().trim().optional(),
  }),

  overallGrade: z.enum([
    "A+",
    "A",
    "B",
    "C",
    "D",
  ]),

  estimatedPrice: z.coerce
    .number()
    .min(0),

  remarks: z.string().trim().optional(),
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

  remarks: z
    .string()
    .trim()
    .optional(),
});

export const updateInspectionStatusSchema = z.object({
  status: z.enum([
    "completed",
    "approved",
    "rejected",
  ]),
});