import { uploadBufferToCloudinary } from "../../lib/uploadBuffer.js";
import axios from "axios";
import crypto from "crypto";
import { sendOtp as sendSmsOtp } from "../../services/sms/sms.service.js";
import { OAuth2Client } from "google-auth-library";

import {
  findUserById,
  findUserByPhone,
  findUserByEmail,
  findUserByGoogleId,
  findUserByFacebookId,
  findOtpByPhone,
  createUser,
  createOtp,
  deleteOtpByPhone,
  incrementOtpAttempts,
  updateLastLogin,
  updateUser,
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  findAgentByPhone,
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

const REFRESH_TOKEN_EXPIRY_MS =
  30 * 24 * 60 * 60 * 1000;

const googleClient =
  new OAuth2Client(
    env.GOOGLE_CLIENT_ID
  );

// SEND USER OTP

export const sendOtp = async (phone) => {
  const user = await findUserByPhone(phone);

if (
  user &&
  (
    user.status === "blocked" ||
    user.status === "deleted"
  )
) {
  throw new ApiError(
    403,
    user.status === "deleted"
      ? "This account is no longer available."
      : "Your account has been blocked. Please contact support."
  );
}

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

  await sendSmsOtp({
    phone,
    otp,
  });

  return {
    message: "OTP sent successfully.",
    ...(env.NODE_ENV === "development" && { otp }),
  };
};

// VERIFY USER OTP

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

    throw new ApiError(
      400,
      "OTP has expired."
    );
  }

  if (otpRecord.otp !== otp) {
    const updatedOtp =
      await incrementOtpAttempts(phone);

    if (updatedOtp.attempts >= 5) {
      await deleteOtpByPhone(phone);

      throw new ApiError(
        429,
        "Maximum OTP attempts exceeded. Please request a new OTP."
      );
    }

    throw new ApiError(
      400,
      "Invalid OTP."
    );
  }

let user = await findUserByPhone(phone);

if (user) {
  if (user.status === "blocked") {
    await deleteOtpByPhone(phone);

    throw new ApiError(
      403,
      "Your account has been blocked. Please contact support."
    );
  }

  if (user.status === "deleted") {
    await deleteOtpByPhone(phone);

    throw new ApiError(
      403,
      "This account is no longer available."
    );
  }

  user = await updateLastLogin(
    user._id
  );
} else {
  user = await createUser({
    phone,
    isPhoneVerified: true,
  });
}

  const tokenPayload = {
    userId: user._id.toString(),
    phone: user.phone,
    role: user.role || "user",
  };

  const accessToken =
    generateAccessToken(tokenPayload);

  const refreshToken =
    generateRefreshToken(tokenPayload);

  await createRefreshToken({
    user: user._id,
    token: refreshToken,
    deviceType,
    deviceId,
    expiresAt: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_MS
    ),
  });

  await deleteOtpByPhone(phone);

  return {
    message: "Login successful.",
    user,
    accessToken,
    refreshToken,
  };
};

// GOOGLE LOGIN

export const googleLogin = async ({
  idToken,
  deviceType,
  deviceId,
}) => {
  let ticket;

  try {
    ticket =
      await googleClient.verifyIdToken({
        idToken,
        audience:
          env.GOOGLE_CLIENT_ID,
      });
  } catch {
    throw new ApiError(
      401,
      "Invalid Google ID token."
    );
  }

  const payload =
    ticket.getPayload();

  if (!payload) {
    throw new ApiError(
      401,
      "Invalid Google account information."
    );
  }

  const {
    sub: googleId,
    email,
    email_verified: emailVerified,
    name,
    picture,
  } = payload;

  if (!googleId || !email) {
    throw new ApiError(
      400,
      "Google account information is incomplete."
    );
  }

  if (emailVerified !== true) {
    throw new ApiError(
      401,
      "Google email address is not verified."
    );
  }

  let user =
    await findUserByGoogleId(
      googleId
    );

  if (user) {
    if (user.status === "blocked") {
      throw new ApiError(
        403,
        "Your account has been blocked. Please contact support."
      );
    }

    if (user.status === "deleted") {
      throw new ApiError(
        403,
        "This account is no longer available."
      );
    }

    if (user.role !== "user") {
      throw new ApiError(
        403,
        "Google login is available only for customer accounts."
      );
    }

    user =
      await updateLastLogin(
        user._id
      );
  } else {
    user =
      await findUserByEmail(
        email
      );

    if (user) {
      throw new ApiError(
        409,
        "An account already exists with this email. Please login using your existing login method."
      );
    } else {
      user =
        await createUser({
          email,
          googleId,
          loginProvider: "google",
          fullName:
            name || "",
          profileImage:
            picture || "",
          role: "user",
          status: "active",
          isPhoneVerified: false,
          lastLogin:
            new Date(),
        });
    }
  }

  const tokenPayload = {
    userId:
      user._id.toString(),
    email:
      user.email,
    role:
      user.role || "user",
  };

  const accessToken =
    generateAccessToken(
      tokenPayload
    );

  const refreshToken =
    generateRefreshToken(
      tokenPayload
    );

  await createRefreshToken({
    user: user._id,
    token: refreshToken,
    deviceType,
    deviceId,
    expiresAt: new Date(
      Date.now() +
        REFRESH_TOKEN_EXPIRY_MS
    ),
  });

  return {
    message:
      "Google login successful.",
    user,
    accessToken,
    refreshToken,
  };
};

// FACEBOOK LOGIN

export const facebookLogin = async ({
  accessToken,
  deviceType,
  deviceId,
}) => {
  if (!accessToken) {
    throw new ApiError(
      400,
      "Facebook access token is required."
    );
  }

  const appAccessToken =
    `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;

  let debugResponse;

  try {
    debugResponse =
      await axios.get(
        `https://graph.facebook.com/${env.FACEBOOK_GRAPH_API_VERSION}/debug_token`,
        {
          params: {
            input_token:
              accessToken,
            access_token:
              appAccessToken,
          },
          timeout: 10000,
        }
      );
  } catch {
    throw new ApiError(
      401,
      "Unable to verify Facebook access token."
    );
  }

  const tokenData =
    debugResponse.data?.data;

  if (
    !tokenData?.is_valid ||
    tokenData.app_id !==
      env.FACEBOOK_APP_ID
  ) {
    throw new ApiError(
      401,
      "Invalid Facebook access token."
    );
  }

  if (
    tokenData.type &&
    tokenData.type !== "USER"
  ) {
    throw new ApiError(
      401,
      "Invalid Facebook user access token."
    );
  }

  if (
    tokenData.expires_at &&
    tokenData.expires_at * 1000 <=
      Date.now()
  ) {
    throw new ApiError(
      401,
      "Facebook access token has expired."
    );
  }

  const appSecretProof =
    crypto
      .createHmac(
        "sha256",
        env.FACEBOOK_APP_SECRET
      )
      .update(accessToken)
      .digest("hex");

  let facebookProfile;

  try {
    const response =
      await axios.get(
        `https://graph.facebook.com/${env.FACEBOOK_GRAPH_API_VERSION}/me`,
        {
          params: {
            fields:
              "id,name,email,picture",
            access_token:
              accessToken,
            appsecret_proof:
              appSecretProof,
          },
          timeout: 10000,
        }
      );

    facebookProfile =
      response.data;
  } catch {
    throw new ApiError(
      401,
      "Unable to fetch Facebook account information."
    );
  }

  const {
    id: facebookId,
    name,
    email,
    picture,
  } = facebookProfile;

  if (!facebookId) {
    throw new ApiError(
      401,
      "Facebook account information is incomplete."
    );
  }

  if (
    tokenData.user_id &&
    tokenData.user_id !== facebookId
  ) {
    throw new ApiError(
      401,
      "Facebook access token does not match the user."
    );
  }

  let user =
    await findUserByFacebookId(
      facebookId
    );

  if (user) {
    if (user.status === "blocked") {
      throw new ApiError(
        403,
        "Your account has been blocked. Please contact support."
      );
    }

    if (user.status === "deleted") {
      throw new ApiError(
        403,
        "This account is no longer available."
      );
    }

    if (user.role !== "user") {
      throw new ApiError(
        403,
        "Facebook login is available only for customer accounts."
      );
    }

    user =
      await updateLastLogin(
        user._id
      );
  } else {
    if (!email) {
      throw new ApiError(
        400,
        "Facebook did not provide an email address. Please use another login method."
      );
    }

    user =
      await findUserByEmail(
        email
      );

    if (user) {
      throw new ApiError(
        409,
        "An account already exists with this email. Please login using your existing login method."
      );
    } else {
      user =
        await createUser({
          email,
          facebookId,
          loginProvider:
            "facebook",
          fullName:
            name || "",
          profileImage:
            picture?.data?.url ||
            "",
          role: "user",
          status: "active",
          isPhoneVerified: false,
          lastLogin:
            new Date(),
        });
    }
  }

  const tokenPayload = {
    userId:
      user._id.toString(),
    email:
      user.email,
    role:
      user.role || "user",
  };

  const newAccessToken =
    generateAccessToken(
      tokenPayload
    );

  const refreshToken =
    generateRefreshToken(
      tokenPayload
    );

  await createRefreshToken({
    user:
      user._id,
    token:
      refreshToken,
    deviceType,
    deviceId,
    expiresAt: new Date(
      Date.now() +
        REFRESH_TOKEN_EXPIRY_MS
    ),
  });

  return {
    message:
      "Facebook login successful.",
    user,
    accessToken:
      newAccessToken,
    refreshToken,
  };
};

// GET CURRENT USER

export const getMe = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found."
    );
  }

  return user;
};

// UPDATE USER PROFILE

export const updateProfile = async (
  userId,
  data,
  file
) => {
const updateData = {};

if (data.fullName !== undefined) {
  updateData.fullName = data.fullName;
}

// Add this block
if (data.email !== undefined) {
  updateData.email = data.email.trim().toLowerCase();
}

if (file) {
  const result =
    await uploadBufferToCloudinary(
      file.buffer,
      {
        folder: "excart/profile-images",
        resource_type: "image",
      }
    );

  updateData.profileImage = result.secure_url;
}

  const updatedUser =
    await updateUser(
      userId,
      updateData
    );

  if (!updatedUser) {
    throw new ApiError(
      404,
      "User not found."
    );
  }

  return updatedUser;
};

// UPDATE AGENT PROFILE

export const updateAgentProfile = async (
  userId,
  data,
  file
) => {
  const agent =
    await findUserById(userId);

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  if (agent.role !== "agent") {
    throw new ApiError(
      403,
      "This account is not an agent account."
    );
  }

  if (agent.status === "blocked") {
    throw new ApiError(
      403,
      "Agent account is blocked."
    );
  }

  const updateData = {};

  if (data.fullName !== undefined) {
    updateData.fullName =
      data.fullName;
  }

  if (data.experience !== undefined) {
    updateData["agentProfile.experience"] =
      data.experience;
  }

  if (data.alternatePhone !== undefined) {
    updateData["agentProfile.alternatePhone"] =
      data.alternatePhone;
  }

  if (file) {
    const result =
      await uploadBufferToCloudinary(
        file.buffer,
        {
          folder:
            "excart/profile-images",
          resource_type:
            "image",
        }
      );

    updateData.profileImage =
      result.secure_url;
  }

  const updatedAgent =
    await updateUser(
      userId,
      updateData
    );

  if (!updatedAgent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  return updatedAgent;
};

// REFRESH TOKEN

export const refreshToken = async (
  refreshToken
) => {
  if (!refreshToken) {
    throw new ApiError(
      401,
      "Refresh token is required."
    );
  }

  const decoded =
    verifyRefreshToken(
      refreshToken
    );

  const storedToken =
    await findRefreshToken(
      refreshToken
    );

  const user =
    await findUserById(
      decoded.userId
    );

  if (!user) {
    throw new ApiError(
      401,
      "User not found."
    );
  }

if (
  user.status === "blocked" ||
  user.status === "deleted"
) {
  throw new ApiError(
    403,
    user.status === "deleted"
      ? "This account is no longer available."
      : "Your account has been blocked."
  );
}

  if (
    !storedToken ||
    storedToken.user.toString() !==
      decoded.userId.toString()
  ) {
    throw new ApiError(
      401,
      "Invalid refresh token."
    );
  }

  if (
    storedToken.expiresAt <
    new Date()
  ) {
    await deleteRefreshToken(
      refreshToken,
      decoded.userId
    );

    throw new ApiError(
      401,
      "Refresh token has expired."
    );
  }

  const tokenPayload = {
    userId:
      user._id.toString(),
    phone:
      user.phone,
    role:
      user.role,
  };

  const accessToken =
    generateAccessToken(
      tokenPayload
    );

  const newRefreshToken =
    generateRefreshToken(
      tokenPayload
    );

  await deleteRefreshToken(
    refreshToken,
    decoded.userId
  );

  await createRefreshToken({
    user:
      storedToken.user,
    token:
      newRefreshToken,
    deviceType:
      storedToken.deviceType,
    deviceId:
      storedToken.deviceId,
    expiresAt: new Date(
      Date.now() +
        REFRESH_TOKEN_EXPIRY_MS
    ),
  });

  return {
    accessToken,
    refreshToken:
      newRefreshToken,
  };
};

// LOGOUT

export const logout = async (
  userId,
  refreshToken
) => {
  if (!refreshToken) {
    throw new ApiError(
      400,
      "Refresh token is required."
    );
  }

  const storedToken =
    await findRefreshToken(
      refreshToken
    );

  if (
    !storedToken ||
    storedToken.user.toString() !==
      userId.toString()
  ) {
    throw new ApiError(
      401,
      "Invalid refresh token."
    );
  }

  await deleteRefreshToken(
    refreshToken,
    userId
  );
};

// SEND AGENT OTP

export const sendAgentOtp = async (
  phone
) => {
  const agent =
    await findAgentByPhone(phone);

  if (!agent) {
    throw new ApiError(
      404,
      "Agent account not found."
    );
  }

  if (agent.status !== "active") {
    throw new ApiError(
      403,
      "Agent account is not active."
    );
  }

  await deleteOtpByPhone(phone);

  const otp = generateOtp();

  const expiresAt = new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES * 60 * 1000
  );

  await createOtp({
    phone,
    otp,
    expiresAt,
  });

  await sendSmsOtp({
    phone,
    otp,
  });

  return {
    message:
      "Agent OTP sent successfully.",
    ...(env.NODE_ENV === "development" && {
      otp,
    }),
  };
};

// VERIFY AGENT OTP

export const verifyAgentOtp = async ({
  phone,
  otp,
  deviceType,
  deviceId,
}) => {
  const otpRecord =
    await findOtpByPhone(phone);

  if (!otpRecord) {
    throw new ApiError(
      400,
      "Invalid OTP."
    );
  }

  if (
    otpRecord.expiresAt <
    new Date()
  ) {
    await deleteOtpByPhone(phone);

    throw new ApiError(
      400,
      "OTP has expired."
    );
  }

  if (otpRecord.otp !== otp) {
    const updatedOtp =
      await incrementOtpAttempts(
        phone
      );

    if (updatedOtp.attempts >= 5) {
      await deleteOtpByPhone(
        phone
      );

      throw new ApiError(
        429,
        "Maximum OTP attempts exceeded. Please request a new OTP."
      );
    }

    throw new ApiError(
      400,
      "Invalid OTP."
    );
  }

  const agent =
    await findAgentByPhone(phone);

  if (!agent) {
    await deleteOtpByPhone(phone);

    throw new ApiError(
      404,
      "Agent account not found."
    );
  }

  if (agent.role !== "agent") {
    await deleteOtpByPhone(phone);

    throw new ApiError(
      403,
      "This account is not an agent account."
    );
  }

  if (agent.status !== "active") {
    await deleteOtpByPhone(phone);

    throw new ApiError(
      403,
      "Agent account is not active."
    );
  }

  const updatedAgent =
    await updateLastLogin(
      agent._id
    );

  const tokenPayload = {
    userId:
      updatedAgent._id.toString(),
    phone:
      updatedAgent.phone,
    role: "agent",
  };

  const accessToken =
    generateAccessToken(
      tokenPayload
    );

  const refreshToken =
    generateRefreshToken(
      tokenPayload
    );

  await createRefreshToken({
    user:
      updatedAgent._id,
    token:
      refreshToken,
    deviceType,
    deviceId,
    expiresAt: new Date(
      Date.now() +
        REFRESH_TOKEN_EXPIRY_MS
    ),
  });

  await deleteOtpByPhone(phone);

  return {
    message:
      "Agent login successful.",
    user:
      updatedAgent,
    accessToken,
    refreshToken,
  };
};