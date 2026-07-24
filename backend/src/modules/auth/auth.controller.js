import asyncHandler from "../../utils/api/asyncHandler.js";
import ApiResponse from "../../utils/response/ApiResponse.js";

import * as authService from "./auth.service.js";

/**
 * @desc    Send OTP
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const result = await authService.sendOtp(phone);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      result.message
    )
  );
});

/**
 * @desc    Verify OTP
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const result = await authService.verifyOtp({
    phone,
    otp,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Login successful."
    )
  );
});

/**
 * @desc    Login with Google
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.googleLogin(req.body);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Google login successful."
    )
  );
});

/**
 * @desc    Login with Facebook
 * @route   POST /api/v1/auth/facebook
 * @access  Public
 */
export const facebookLogin = asyncHandler(async (req, res) => {
  const result = await authService.facebookLogin(req.body);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Facebook login successful."
    )
  );
});

/**
 * @desc    Refresh Access Token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshToken(refreshToken);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Token refreshed successfully."
    )
  );
});

/**
 * @desc    Logout
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Logged out successfully."
    )
  );
});

/**
 * @desc    Get Logged-in User
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const result = await authService.getMyProfile(req.user.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Profile fetched successfully."
    )
  );
});