import {
  findUserByPhone,
  findOtpByPhone,
  createUser,
  createOtp,
  deleteOtpByPhone,
  incrementOtpAttempts,
  updateLastLogin,
} from "./auth.repository.js";

import { generateOtp } from "../../utils/generateOtp.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../lib/jwt.js";

import ApiError from "../../utils/errors/ApiError.js";
import { env } from "../../config/env/index.js";

const OTP_EXPIRY_MINUTES = 5;

export const sendOtp = async (phone) => {
  // Check if the user exists and is blocked
  const user = await findUserByPhone(phone);

  if (user && user.status === "blocked") {
    throw new ApiError(
      403,
      "Your account has been blocked. Please contact support."
    );
  }

  // Remove any existing OTP
  await deleteOtpByPhone(phone);

  // Generate secure OTP
  const otp = generateOtp();

  // Set expiry time
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  // Save OTP
  await createOtp({
    phone,
    otp,
    expiresAt,
  });

  /**
   * TODO:
   * Integrate SMS provider here.
   *
   * Example:
   * await smsService.sendOtp(phone, otp);
   */

  // Only expose OTP in development
  return {
    message: "OTP sent successfully.",
    ...(env.NODE_ENV === "development" && { otp }),
  };
};

export const verifyOtp = async ({ phone, otp }) => {

  const otpRecord = await findOtpByPhone(phone);

  if (!otpRecord) {
  throw new ApiError(400, "Invalid OTP.");
}

if (otpRecord.expiresAt < new Date()) {
  await deleteOtpByPhone(phone);

  throw new ApiError(400, "OTP has expired.");
}

};