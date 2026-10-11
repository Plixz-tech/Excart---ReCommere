import { z } from "zod";
export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters."),
  deviceType: z
    .string()
    .min(1, "Device type is required."),
  deviceId: z
    .string()
    .min(1, "Device ID is required."),
});
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  profileImage: z.string().url().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required."),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(128, "New password cannot exceed 128 characters."),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password."),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "New password and confirmation do not match.",
      path: ["confirmPassword"],
    }
  );

export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, "Refresh token is required."),
});