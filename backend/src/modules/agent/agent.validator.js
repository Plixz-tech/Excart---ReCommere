import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");

/*
 * AGENT ID
 *
 * Used with validateParams()
 * Validates req.params
 */
export const agentIdSchema = z.object({
  id: objectId,
});


/*
 * CREATE AGENT
 *
 * Used with validateRequest()
 * Validates req.body
 */
export const createAgentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      3,
      "Full name must be at least 3 characters."
    )
    .max(100),

  email: z
    .string()
    .trim()
    .email("Invalid email address."),

  phone: z
    .string()
    .trim()
    .min(
      8,
      "Phone number must be at least 8 characters."
    )
    .max(
      15,
      "Phone number must be at most 15 characters."
    ),

  countryCode: z
    .string()
    .trim()
    .default("+91"),

  password: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters."
    ),
});


/*
 * UPDATE AGENT
 *
 * Used with validateRequest()
 * Validates req.body
 */
export const updateAgentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      3,
      "Full name must be at least 3 characters."
    )
    .max(100)
    .optional(),

  email: z
    .string()
    .trim()
    .email("Invalid email address.")
    .optional(),

  phone: z
    .string()
    .trim()
    .min(8)
    .max(15)
    .optional(),

  countryCode: z
    .string()
    .trim()
    .optional(),

  profileImage: z
    .string()
    .optional(),

  agentProfile: z
    .object({
      experience: z
        .coerce
        .number()
        .min(0)
        .optional(),

      alternatePhone: z
        .string()
        .trim()
        .min(8)
        .max(15)
        .optional(),

      workingHours: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),

      address: z
        .object({
          line1: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          pinCode: z.string().optional(),
        })
        .optional(),

      operatingArea: z
        .string()
        .optional(),

      onboardingDate: z
        .string()
        .optional(),

      coverage: z
        .object({
          primaryArea: z.string().optional(),

          areasCovered: z
            .array(z.string())
            .optional(),
        })
        .optional(),
    })
    .optional(),
});


/*
 * UPDATE AGENT STATUS
 *
 * Used with validateRequest()
 * Validates req.body
 */
export const updateAgentStatusSchema = z.object({
  status: z.enum(
    ["active", "inactive", "blocked"],
    {
      message:
        "Status must be active, inactive, or blocked.",
    }
  ),
});


/*
 * SEND AADHAAR OTP
 *
 * Used with validateRequest()
 * Validates req.body
 */
export const sendAadhaarOtpSchema = z.object({
  aadhaarNumber: z
    .string()
    .trim()
    .regex(
      /^\d{12}$/,
      "Aadhaar number must be exactly 12 digits."
    ),
});


/*
 * VERIFY AADHAAR OTP
 *
 * Used with validateRequest()
 * Validates req.body
 */
export const verifyAadhaarOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(
      6,
      "OTP must be 6 digits."
    )
    .regex(
      /^\d+$/,
      "OTP must contain only numbers."
    ),
});


/*
 * OLD AADHAAR VALIDATOR
 *
 * Kept for backward compatibility.
 */
export const verifyAadhaarSchema = z.object({
  aadhaarNumber: z
    .string()
    .trim()
    .regex(
      /^\d{12}$/,
      "Aadhaar number must be exactly 12 digits."
    ),
});


/*
 * VERIFY PAN
 *
 * Used with validateRequest()
 * Validates req.body
 */
export const verifyPanSchema = z.object({
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{5}[0-9]{4}[A-Z]$/,
      "Invalid PAN number."
    ),
});