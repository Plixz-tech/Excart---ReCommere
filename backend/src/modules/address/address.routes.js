import { Router } from "express";

import * as addressController from "./address.controller.js";

import {
  createAddressSchema,
  addressIdSchema,
  updateAddressSchema,
  pincodeSchema,
} from "./address.validator.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("user"),
  validateRequest(createAddressSchema),
  addressController.createAddress
);

router.get(
  "/",
  protect,
  authorize("user"),
  addressController.getAddresses
);

router.get(
  "/:id",
  protect,
  authorize("user"),
  validateParams(addressIdSchema),
  addressController.getAddressById
);

router.patch(
  "/:id",
  protect,
  authorize("user"),
  validateParams(addressIdSchema),
  validateRequest(updateAddressSchema),
  addressController.updateAddress
);

router.delete(
  "/:id",
  protect,
  authorize("user"),
  validateParams(addressIdSchema),
  addressController.deleteAddress
);

router.get(
  "/location/:pincode",
  validateParams(pincodeSchema),
  addressController.getLocationByPincode
);

export default router;