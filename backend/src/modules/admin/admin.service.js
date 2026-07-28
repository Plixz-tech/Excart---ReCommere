import bcrypt from "bcrypt";

import {
  findAdminByEmail,
  updateAdminLastLogin,
  findAdminById,
  updateAdminProfile,
  findAdminWithPasswordById,
  updateAdminPassword,
} from "./admin.repository.js";

import {
  createRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
  deleteUserRefreshTokens,
} from "../auth/auth.repository.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";

import { findUserById } from "../auth/auth.repository.js";

import ApiError from "../../utils/errors/ApiError.js";

const REFRESH_TOKEN_EXPIRY_MS =
  30 * 24 * 60 * 60 * 1000; // 30 days

export const login = async ({
  email,
  password,
  deviceType,
  deviceId,
}) => {
  const admin = await findAdminByEmail(email);

  if (!admin) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    admin.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  await updateAdminLastLogin(admin._id);

  const tokenPayload = {
    userId: admin._id.toString(),
    phone: admin.phone,
    role: admin.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await createRefreshToken({
    user: admin._id,
    token: refreshToken,
    deviceType,
    deviceId,
    expiresAt: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_MS
    ),
  });

  admin.password = undefined;

  return {
    admin,
    accessToken,
    refreshToken,
  };
};

export const getProfile = async (adminId) => {
  const admin = await findAdminById(adminId);

  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  return admin;
};

export const updateProfile = async (adminId, data) => {
  const updateData = {
    fullName: data.fullName,
    email: data.email,
    profileImage: data.profileImage,
  };

  const admin = await updateAdminProfile(adminId, updateData);

  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  return admin;
};

export const changePassword = async (
  adminId,
  { currentPassword, newPassword }
) => {
  const admin = await findAdminWithPasswordById(adminId);

  if (!admin) {
    throw new ApiError(404, "Admin not found.");
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    admin.password
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(400, "Current password is incorrect.");
  }

  const isSamePassword = await bcrypt.compare(
    newPassword,
    admin.password
  );

  if (isSamePassword) {
    throw new ApiError(
      400,
      "New password must be different from the current password."
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await updateAdminPassword(adminId, hashedPassword);
};

export const logout = async (refreshToken) => {
  const token = await deleteRefreshToken(refreshToken);

  if (!token) {
    throw new ApiError(404, "Refresh token not found.");
  }

  return;
};


export const logoutAll = async (adminId) => {
  await deleteUserRefreshTokens(adminId);
};