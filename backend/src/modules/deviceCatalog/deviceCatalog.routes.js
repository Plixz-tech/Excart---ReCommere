import express from "express";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";
import validateQuery from "../../middlewares/validation/validateQuery.js";

import {
  createDeviceCatalogController,
  getActiveDeviceCatalogController,
  getAllDeviceCatalogController,
  getDeviceCatalogByIdController,
  findMatchingDeviceCatalogController,
  updateDeviceCatalogController,
  deleteDeviceCatalogController,
  getDeviceCatalogEvaluationController,
  getDefaultDeviceCatalogEvaluationController
} from "./deviceCatalog.controller.js";

import {
  createDeviceCatalogSchema,
  updateDeviceCatalogSchema,
  deviceCatalogIdSchema,
  findMatchingDeviceCatalogSchema,
} from "./deviceCatalog.validator.js";

const router = express.Router();

// CUSTOMER / AUTHENTICATED USER

router.get(
  "/",
  getActiveDeviceCatalogController
);

// GET DEFAULT DEVICE EVALUATION CONFIGURATION

router.get(
  "/evaluation/default",
  protect,
  authorize("admin"),
  getDefaultDeviceCatalogEvaluationController
);

// GET DEVICE EVALUATION CONFIGURATION

router.get(
  "/:id/evaluation",
  validateParams(deviceCatalogIdSchema),
  getDeviceCatalogEvaluationController
);

// FIND SPECIFIC DEVICE VARIANT

router.get(
  "/match",
  protect,
  validateQuery(findMatchingDeviceCatalogSchema),
  findMatchingDeviceCatalogController
);

// ADMIN CREATE

router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(createDeviceCatalogSchema),
  createDeviceCatalogController
);

// ADMIN GET ALL

router.get(
  "/all",
  protect,
  authorize("admin"),
  getAllDeviceCatalogController
);

// ADMIN GET BY ID

router.get(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(deviceCatalogIdSchema),
  getDeviceCatalogByIdController
);

// ADMIN UPDATE

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(deviceCatalogIdSchema),
  validateRequest(updateDeviceCatalogSchema),
  updateDeviceCatalogController
);

// ADMIN DELETE

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(deviceCatalogIdSchema),
  deleteDeviceCatalogController
);

export default router;