import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ID."
  );



// CREATE ORDER


export const createOrderSchema = z.object({
  brand:
    z
      .string()
      .trim()
      .min(
        1,
        "Brand is required."
      ),

  model:
    z
      .string()
      .trim()
      .min(
        1,
        "Model is required."
      ),

  variant:
    z
      .string()
      .trim()
      .optional(),

  color:
    z
      .string()
      .trim()
      .optional(),

  storage:
    z
      .string()
      .trim()
      .optional(),

  ram:
    z
      .string()
      .trim()
      .optional(),

  imei1:
    z
      .string()
      .trim()
      .regex(
        /^\d{15}$/,
        "IMEI1 must contain exactly 15 digits."
      ),

  imei2:
    z
      .string()
      .trim()
      .regex(
        /^\d{15}$/,
        "IMEI2 must contain exactly 15 digits."
      )
      .optional(),

  serialNumber:
    z
      .string()
      .trim()
      .optional(),

  // Estimated amount from the initial valuation.
  estimatedAmount:
    z
      .coerce
      .number()
      .min(
        0,
        "Estimated amount cannot be negative."
      )
      .optional(),

  customerEvaluation:
    z
      .object({
        screenCondition:
          z
            .string()
            .trim()
            .optional(),

        displayIssues:
          z
            .array(
              z.string().trim()
            )
            .optional(),

        bodyCondition:
          z
            .string()
            .trim()
            .optional(),

        batteryHealth:
          z
            .coerce
            .number()
            .min(0)
            .max(100)
            .nullable()
            .optional(),

        repairHistory:
          z
            .string()
            .trim()
            .optional(),

        accessories:
          z
            .array(
              z.string().trim()
            )
            .optional(),

        functionalIssues:
          z
            .array(
              z.string().trim()
            )
            .optional(),

        imeiVerification:
          z
            .object({
              verified:
                z
                  .boolean()
                  .optional(),

              verifiedAt:
                z
                  .string()
                  .optional(),
            })
            .optional(),
      })
      .optional(),

  photos:
    z
      .array(
        z.object({
          url:
            z
              .string()
              .min(
                1,
                "Photo URL is required."
              ),

          publicId:
            z
              .string()
              .optional(),
        })
      )
      .optional(),

  // ==========================================================
  // PICKUP
  // ==========================================================

  pickup:
    z
      .object({
        scheduledDate:
          z
            .string()
            .regex(
              /^\d{4}-\d{2}-\d{2}$/,
              "Scheduled date must be in YYYY-MM-DD format."
            ),

        scheduledTime:
          z
            .string()
            .regex(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "Scheduled time must be in HH:mm format."
            ),

        address:
          z
            .object({
              line1:
                z
                  .string()
                  .trim()
                  .min(
                    1,
                    "Address line is required."
                  )
                  .max(200),

              city:
                z
                  .string()
                  .trim()
                  .min(
                    1,
                    "City is required."
                  )
                  .max(100),

              state:
                z
                  .string()
                  .trim()
                  .min(
                    1,
                    "State is required."
                  )
                  .max(100),

              pinCode:
                z
                  .string()
                  .trim()
                  .min(
                    4,
                    "Pin code is required."
                  )
                  .max(10),

              latitude:
                z
                  .coerce
                  .number()
                  .min(-90)
                  .max(90)
                  .optional()
                  .nullable(),

              longitude:
                z
                  .coerce
                  .number()
                  .min(-180)
                  .max(180)
                  .optional()
                  .nullable(),
            }),

        notes:
          z
            .string()
            .trim()
            .max(1000)
            .optional(),
      }),

  notes:
    z
      .string()
      .trim()
      .max(1000)
      .optional(),
});



// UPDATE ORDER


export const updateOrderSchema = z.object({
  device:
    objectId
      .optional()
      .nullable(),

  pickup:
    z
      .object({
        status:
          z
            .enum([
              "pending",
              "assigned",
              "scheduled",
              "in_progress",
              "completed",
              "cancelled",
            ])
            .optional(),

        scheduledDate:
          z
            .string()
            .regex(
              /^\d{4}-\d{2}-\d{2}$/,
              "Scheduled date must be in YYYY-MM-DD format."
            )
            .optional(),

        scheduledTime:
          z
            .string()
            .regex(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "Scheduled time must be in HH:mm format."
            )
            .optional(),

        address:
          z
            .object({
              line1:
                z
                  .string()
                  .trim()
                  .max(200)
                  .optional(),

              city:
                z
                  .string()
                  .trim()
                  .max(100)
                  .optional(),

              state:
                z
                  .string()
                  .trim()
                  .max(100)
                  .optional(),

              pinCode:
                z
                  .string()
                  .trim()
                  .min(4)
                  .max(10)
                  .optional(),

              latitude:
                z
                  .coerce
                  .number()
                  .min(-90)
                  .max(90)
                  .optional()
                  .nullable(),

              longitude:
                z
                  .coerce
                  .number()
                  .min(-180)
                  .max(180)
                  .optional()
                  .nullable(),
            })
            .optional(),

        notes:
          z
            .string()
            .trim()
            .max(1000)
            .optional(),
      })
      .optional(),

  estimatedAmount:
    z
      .coerce
      .number()
      .min(
        0,
        "Estimated amount cannot be negative."
      )
      .optional(),

  finalAmount:
    z
      .coerce
      .number()
      .min(
        0,
        "Final amount cannot be negative."
      )
      .optional(),

  notes:
    z
      .string()
      .trim()
      .max(1000)
      .optional(),
});



// ORDER ID


export const orderIdSchema = z.object({
  id: objectId,
});



// ORDER STATUS


export const orderStatusSchema = z.object({
  status:
    z.enum([
      "pending",
      "assigned",
      "pickup_scheduled",
      "picked_up",
      "in_transit",
      "inspection_pending",
      "inspection_in_progress",
      "inspection_completed",
      "approved",
      "payment_pending",
      "payment_completed",
      "ready_stock",
      "completed",
      "cancelled",
      "rejected",
    ]),
});



// ASSIGN ORDER


export const assignOrderSchema = z.object({
  agentId: objectId,
});



// PROCESS PAYMENT


export const processPaymentSchema = z.object({
  finalAmount:
    z
      .coerce
      .number()
      .positive(
        "Final amount must be greater than 0."
      ),

  paymentMethod:
    z.enum([
      "bank_transfer",
      "upi",
      "cash",
      "other",
    ]),

  transactionId:
    z
      .string()
      .trim()
      .optional(),

  notes:
    z
      .string()
      .trim()
      .max(1000)
      .optional(),
});



// AGENT PICKUP


export const agentPickupSchema = z.object({
  status:
    z.literal("picked_up"),
});



// START TRANSIT


export const startTransitSchema = z.object({
  status:
    z.literal("in_transit"),
});



// RECEIVE ORDER


export const receiveOrderSchema = z.object({
  status:
    z.literal("inspection_pending"),
});



// CUSTOMER AADHAAR - SEND OTP


export const sendCustomerAadhaarOtpSchema = z.object({
  aadhaarNumber:
    z
      .string()
      .trim()
      .regex(
        /^\d{12}$/,
        "Aadhaar number must contain exactly 12 digits."
      ),
});



// CUSTOMER AADHAAR - VERIFY OTP


export const verifyCustomerAadhaarOtpSchema = z.object({
  otp:
    z
      .string()
      .trim()
      .regex(
        /^\d{6}$/,
        "OTP must contain exactly 6 digits."
      ),
});



// PICKUP VERIFICATION


export const pickupVerificationSchema = z.object({
  customerPhotoUrl:
    z
      .string()
      .min(
        1,
        "Customer photo is required."
      ),

  customerPhotoPublicId:
    z
      .string()
      .optional(),

  aadhaarUrl:
    z
      .string()
      .min(
        1,
        "Aadhaar document is required."
      ),

  aadhaarPublicId:
    z
      .string()
      .optional(),
});



// SELF ASSIGN


export const selfAssignOrderSchema = z.object({
  confirm:
    z.literal(true),
});



// ASSIGN TO AGENT


export const assignToAgentSchema = z.object({
  agentId: objectId,
});



// SCHEDULE PICKUP


export const schedulePickupSchema = z.object({
  scheduledDate:
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Scheduled date must be in YYYY-MM-DD format."
      ),

  scheduledTime:
    z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Scheduled time must be in HH:mm format."
      ),
});



// RESCHEDULE PICKUP


export const reschedulePickupSchema = z.object({
  scheduledDate:
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Scheduled date must be in YYYY-MM-DD format."
      ),

  scheduledTime:
    z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Scheduled time must be in HH:mm format."
      ),
});



// PICKUP LOCATION


export const pickupLocationSchema = z.object({
  latitude:
    z
      .coerce
      .number()
      .min(-90)
      .max(90),

  longitude:
    z
      .coerce
      .number()
      .min(-180)
      .max(180),
});



// START INSPECTION


export const startInspectionSchema = z.object({
  status:
    z.literal(
      "inspection_in_progress"
    ),
});



// COMPLETE INSPECTION


export const completeInspectionSchema = z.object({
  condition:
    z
      .string()
      .trim()
      .optional(),

  grade:
    z
      .string()
      .trim()
      .optional(),

  physicalCondition:
    z
      .string()
      .trim()
      .optional(),

  screenCondition:
    z
      .string()
      .trim()
      .optional(),

  batteryHealth:
    z
      .coerce
      .number()
      .min(0)
      .max(100)
      .nullable()
      .optional(),

  functionalIssues:
    z
      .array(
        z.string().trim()
      )
      .optional(),

  inspectionNotes:
    z
      .string()
      .trim()
      .max(2000)
      .optional(),
});



// APPROVE INSPECTION


export const approveInspectionSchema = z.object({
  status:
    z.literal("approved"),
});



// REJECT INSPECTION


export const rejectInspectionSchema = z.object({
  status:
    z.literal("rejected"),

  reason:
    z
      .string()
      .trim()
      .min(
        1,
        "Rejection reason is required."
      )
      .max(2000),
});