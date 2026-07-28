import { Router } from "express";

import * as adminController from "./admin.controller.js";
import {
  adminLoginSchema,updateProfileSchema, changePasswordSchema,logoutSchema} from "./admin.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = Router();

// Admin Login
router.post(
  "/login",
  validateRequest(adminLoginSchema),
  adminController.login
);

// Protected Dashboard
router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Admin",
      user: req.user,
    });
  }
);

router.get(
  "/me",
  protect,
  authorize("admin"),
  adminController.getProfile
);

router.patch(
  "/me",
  protect,
  authorize("admin"),
  validateRequest(updateProfileSchema),
  adminController.updateProfile
);
console.log(adminController.changePassword);
router.patch(
  "/change-password",
  protect,
  authorize("admin"),
  validateRequest(changePasswordSchema),
  adminController.changePassword
);

router.post(
  "/logout",
  validateRequest(logoutSchema),
  adminController.logout
);


router.post(
  "/logout-all",
  protect,
  authorize("admin"),
  adminController.logoutAll
);

export default router;