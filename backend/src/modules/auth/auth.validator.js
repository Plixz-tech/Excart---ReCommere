import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number"),

  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),

  deviceType: z.enum(["android", "ios", "web"]),

  deviceId: z.string().optional(),
});