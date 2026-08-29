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
  deviceId: z.string().min(1, "Device ID is required"),
});
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required."),
});
export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required."),
});

export const updateProfileSchema = z.object({
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
export const sendAgentOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, "Phone number is required.")
    .max(15, "Invalid phone number."),
});
export const verifyAgentOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, "Phone number is required.")
    .max(15, "Invalid phone number."),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits.")
    .regex(/^\d+$/, "OTP must contain only numbers."),
  deviceType: z.enum(
    ["android", "ios", "web"],
    {
      message: "Invalid device type.",
    }
  ),
  deviceId: z
    .string()
    .trim()
    .min(1, "Device ID is required."),
});

