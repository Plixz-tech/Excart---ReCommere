import { Router } from "express";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import upload from "../../middlewares/upload.js";

import authorize from "../../middlewares/auth/authorize.js";

import otpRateLimiter from "../../middlewares/security/otpRateLimiter.js";

import socialLoginRateLimiter from "../../middlewares/security/socialLoginRateLimiter.js";

import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
  updateProfileSchema,
  updateAgentProfileSchema,
  sendAgentOtpSchema,
  verifyAgentOtpSchema,
  googleLoginSchema,
  facebookLoginSchema,
} from "./auth.validator.js";

import protect from "../../middlewares/auth/protect.js";

import {
  sendOtp,
  verifyOtp,
  googleLogin,
  facebookLogin,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  updateAgentProfileController,
  sendAgentOtp,
  verifyAgentOtp,
} from "./auth.controller.js";

const router = Router();

router.post(
  "/send-otp",
  otpRateLimiter,
  validateRequest(sendOtpSchema),
  sendOtp
);

router.post(
  "/verify-otp",
  validateRequest(verifyOtpSchema),
  verifyOtp
);

router.post(
  "/google",
  socialLoginRateLimiter,
  validateRequest(googleLoginSchema),
  googleLogin
);

router.post(
  "/facebook",
  socialLoginRateLimiter,
  validateRequest(facebookLoginSchema),
  facebookLogin
);

router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  refreshToken
);

router.post(
  "/logout",
  protect,
  validateRequest(logoutSchema),
  logout
);

router.get(
  "/me",
  protect,
  getMe
);

router.patch(
  "/me",
  protect,
  upload.single("profileImage"),
  validateRequest(updateProfileSchema),
  updateProfile
);

router.patch(
  "/agent/me",
  protect,
  authorize("agent"),
  upload.single("profileImage"),
  validateRequest(updateAgentProfileSchema),
  updateAgentProfileController
);

router.post(
  "/agent/send-otp",
  otpRateLimiter,
  validateRequest(sendAgentOtpSchema),
  sendAgentOtp
);

router.post(
  "/agent/verify-otp",
  validateRequest(verifyAgentOtpSchema),
  verifyAgentOtp
);

router.post(
  "/agent/logout",
  protect,
  authorize("agent"),
  validateRequest(logoutSchema),
  logout
);

export default router;