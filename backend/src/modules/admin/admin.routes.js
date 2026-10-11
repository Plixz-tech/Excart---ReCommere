import { Router } from "express";
import * as adminController from "./admin.controller.js";
import {
  adminLoginSchema,
  updateProfileSchema,
  changePasswordSchema,
  logoutSchema,
} from "./admin.validator.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import reportController from "../report/report.controller.js";

const router = Router();

// Admin Login
router.post(
  "/login",
  validateRequest(adminLoginSchema),
  adminController.login
);

// Admin Dashboard
router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  reportController.getDashboard
);

// Admin Profile
router.get(
  "/me",
  protect,
  authorize("admin"),
  adminController.getProfile
);

// Update Admin Profile
router.patch(
  "/me",
  protect,
  authorize("admin"),
  validateRequest(updateProfileSchema),
  adminController.updateProfile
);

// Change Password
router.patch(
  "/change-password",
  protect,
  authorize("admin"),
  validateRequest(changePasswordSchema),
  adminController.changePassword
);

// Logout
router.post(
  "/logout",
  protect,
  authorize("admin"),
  validateRequest(logoutSchema),
  adminController.logout
);

// Logout All Sessions
router.post(
  "/logout-all",
  protect,
  authorize("admin"),
  adminController.logoutAll
);

export default router;