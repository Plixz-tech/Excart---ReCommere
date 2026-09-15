import { Router } from "express";

import protect from "../../middlewares/auth/protect.js";

import * as settingController from "./setting.controller.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import { updateSettingsSchema } from "./setting.validator.js";

const router = Router();

router.use(protect);

router.get(
  "/",
  settingController.getSettings
);

router.patch(
  "/",
  validateRequest(updateSettingsSchema),
  settingController.updateSettings
);

export default router;