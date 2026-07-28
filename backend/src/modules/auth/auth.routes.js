import { Router } from "express";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import {sendOtpSchema, verifyOtpSchema, refreshTokenSchema, logoutSchema,} from "./auth.validator.js";
import protect from "../../middlewares/auth/protect.js";

import {sendOtp, verifyOtp, googleLogin,facebookLogin,refreshToken, logout, getMe} from "./auth.controller.js";

const router = Router();

router.post("/send-otp",validateRequest(sendOtpSchema), sendOtp);

router.post( "/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);

router.post("/google", googleLogin);

router.post("/facebook", facebookLogin);

router.post( "/refresh-token", validateRequest(refreshTokenSchema), refreshToken);

router.post( "/logout", protect, validateRequest(logoutSchema), logout);

router.get("/me", protect, getMe);

export default router;