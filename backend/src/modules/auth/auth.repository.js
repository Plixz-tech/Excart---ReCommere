import User from "../../models/User.js";
import Otp from "../../models/Otp.js";
import RefreshToken from "../../models/RefreshToken.js";

/* USER */

export const findUserById = async (userId) => {
  return User.findById(userId);
};

export const findUserByPhone = async (phone) => {
  return User.findOne({ phone });
};

export const findUserByGoogleId = async (googleId) => {
  return User.findOne({ googleId });
};

export const findUserByFacebookId = async (facebookId) => {
  return User.findOne({ facebookId });
};

export const createUser = async (userData) => {
  return User.create(userData);
};

export const updateUser = async (userId, data) => {
  return User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  });
};

export const updateLastLogin = async (userId) => {
  return User.findByIdAndUpdate(
    userId,
    {
      lastLogin: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

/* OTP */

export const findOtpByPhone = async (phone) => {
  return Otp.findOne({ phone });
};

export const createOtp = async (otpData) => {
  return Otp.create(otpData);
};

export const deleteOtpByPhone = async (phone) => {
  return Otp.deleteOne({ phone });
};

export const incrementOtpAttempts = async (phone) => {
  return Otp.findOneAndUpdate(
    { phone },
    {
      $inc: { attempts: 1 },
    },
    {
      new: true,
    }
  );
};

/* REFRESH TOKEN */

export const createRefreshToken = async (tokenData) => {
  return RefreshToken.create(tokenData);
};

export const findRefreshToken = async (token) => {
  return RefreshToken.findOne({ token });
};

export const deleteRefreshToken = async (token) => {
  return RefreshToken.findOneAndDelete({ token });
};

export const deleteUserRefreshTokens = async (userId) => {
  return RefreshToken.deleteMany({
    user: userId,
  });
};