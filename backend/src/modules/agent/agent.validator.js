import { z } from "zod";

export const createAgentSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters.")
      .max(100),

    email: z
      .string()
      .trim()
      .email("Invalid email address."),

    phone: z
      .string()
      .trim()
      .min(8)
      .max(15),

    countryCode: z
      .string()
      .trim()
      .default("+91"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters."),
  }),
});

export const updateAgentSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Agent ID is required."),
  }),

body: z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters.")
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

  agentProfile: z.object({
    experience: z.number().min(0).optional(),

    alternatePhone: z
      .string()
      .trim()
      .min(8)
      .max(15)
      .optional(),

    workingHours: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),

    address: z.object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pinCode: z.string().optional(),
    }).optional(),

    operatingArea: z.string().optional(),

    onboardingDate: z.string().optional(),

    coverage: z.object({
      primaryArea: z.string().optional(),
      areasCovered: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
}),
});
export const updateAgentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive", "blocked"]),
  }),
});

export const verifyAadhaarSchema = z.object({
  body: z.object({
aadhaarNumber: z
  .string()
  .trim()
  .regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits.")
  }),
});

export const verifyPanSchema = z.object({
  body: z.object({
    panNumber: z
      .string()
      .trim()
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        "Invalid PAN number."
      ),
  }),
});