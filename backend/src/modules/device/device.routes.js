import express from "express";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

import * as deviceController from "./device.controller.js";

import {
  createDeviceSchema,
  deviceIdSchema,
  updateDeviceSchema,
  updateDeviceStatusSchema,
  verifyIMEISchema,
} from "./device.validator.js";

const router = express.Router();


// CREATE DEVICE

router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(createDeviceSchema),
  deviceController.createDevice
);


// GET DEVICES

router.get(
  "/",
  protect,
  authorize("admin"),
  deviceController.getDevices
);



// GET DEVICE BY ID

router.get(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(deviceIdSchema),
  deviceController.getDeviceById
);


// UPDATE DEVICE

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(deviceIdSchema),
  validateRequest(updateDeviceSchema),
  deviceController.updateDevice
);


// UPDATE DEVICE STATUS

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  validateParams(deviceIdSchema),
  validateRequest(updateDeviceStatusSchema),
  deviceController.updateDeviceStatus
);


// DELETE DEVICE

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(deviceIdSchema),
  deviceController.deleteDevice
);


// VERIFY IMEI

router.post(
  "/verify-imei",
  validateRequest(verifyIMEISchema),
  deviceController.verifyIMEI
);


export default router;