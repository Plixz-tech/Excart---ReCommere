import { z } from "zod";

export const updateSettingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .optional(),
});