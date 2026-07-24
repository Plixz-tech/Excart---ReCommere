import {
  findUserById,
  findUserByPhone,
  findOtpByPhone,
  createUser,
  createOtp,
  deleteOtpByPhone,
  incrementOtpAttempts,
  updateLastLogin,
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
} from "./auth.repository.js";

import { generateOtp } from "../../utils/generateOtp.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";

import ApiError from "../../utils/errors/ApiError.js";
import { env } from "../../config/env/index.js";

const OTP_EXPIRY_MINUTES = 5;

export const sendOtp = async (phone) => {
  const user = await findUserByPhone(phone);

  // Prevent blocked users from requesting OTPs.
  if (user && user.status === "blocked") {
    throw new ApiError(
      403,
      "Your account has been blocked. Please contact support."
    );
  }

  // Replace any existing OTP with a new one.
  await deleteOtpByPhone(phone);

  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  await createOtp({
    phone,
    otp,
    expiresAt,
  });

  // TODO: Integrate SMS provider here.

  return {
    message: "OTP sent successfully.",
    ...(env.NODE_ENV === "development" && { otp }),
  };
};

export const verifyOtp = async ({
  phone,
  otp,
  deviceType,
  deviceId,
}) => {
  const otpRecord = await findOtpByPhone(phone);

  if (!otpRecord) {
    throw new ApiError(400, "Invalid OTP.");
  }

  if (otpRecord.expiresAt < new Date()) {
    await deleteOtpByPhone(phone);
    throw new ApiError(400, "OTP has expired.");
  }

  if (otpRecord.otp !== otp) {
    const updatedOtp = await incrementOtpAttempts(phone);

    // Invalidate OTP after repeated failed attempts.
    if (updatedOtp.attempts >= 5) {
      await deleteOtpByPhone(phone);

      throw new ApiError(
        429,
        "Maximum OTP attempts exceeded. Please request a new OTP."
      );
    }

    throw new ApiError(400, "Invalid OTP.");
  }

  let user = await findUserByPhone(phone);

  if (!user) {
    user = await createUser({
      phone,
      isPhoneVerified: true,
    });
  } else {
    user = await updateLastLogin(user._id);
  }

const tokenPayload = {
  userId: user._id.toString(),
  phone: user.phone,
  role: user.role || "user",
};

const accessToken = generateAccessToken(tokenPayload);
const refreshToken = generateRefreshToken(tokenPayload);

  await createRefreshToken({
    user: user._id,
    token: refreshToken,
    deviceType,
    deviceId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  // OTP is single-use and must be removed after successful verification.
  await deleteOtpByPhone(phone);

  return {
    message: "Login successful.",
    user,
    accessToken,
    refreshToken,
  };
};

  export const getMe = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return user;
};