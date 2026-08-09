import { Router } from "express";

import * as serviceAreaController from "./serviceArea.controller.js";

import {
  createServiceAreaSchema,
  updateServiceAreaSchema,
} from "./serviceArea.validator.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";

const router = Router();

router.get(
  "/check/:pincode",
  serviceAreaController.checkServiceability
);

router.get(
  "/check-location",
  serviceAreaController.checkLocationServiceability
);


router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(createServiceAreaSchema),
  serviceAreaController.createServiceArea
);

router.get(
  "/",
  protect,
  authorize("admin"),
  serviceAreaController.getServiceAreas
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  serviceAreaController.getServiceAreaById
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateRequest(updateServiceAreaSchema),
  serviceAreaController.updateServiceArea
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  serviceAreaController.deleteServiceArea
);


export default router;