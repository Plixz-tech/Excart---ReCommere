import express from "express";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";

import * as deviceController from "./device.controller.js";

import {
  createDeviceSchema,
  updateDeviceSchema,
  updateDeviceStatusSchema,
} from "./device.validator.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(createDeviceSchema),
  deviceController.createDevice
);

router.get(
  "/",
  protect,
  authorize("admin"),
  deviceController.getDevices
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  deviceController.getDeviceById
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateRequest(updateDeviceSchema),
  deviceController.updateDevice
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  validateRequest(updateDeviceStatusSchema),
  deviceController.updateDeviceStatus
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deviceController.deleteDevice
);

export default router;