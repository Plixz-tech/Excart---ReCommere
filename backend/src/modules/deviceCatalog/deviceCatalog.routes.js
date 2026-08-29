import express from "express";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";

import {
  createDeviceCatalogController,
  getActiveDeviceCatalogController,
  getAllDeviceCatalogController,
  getDeviceCatalogByIdController,
  findMatchingDeviceCatalogController,
  updateDeviceCatalogController,
  deleteDeviceCatalogController,
} from "./deviceCatalog.controller.js";

import {
  createDeviceCatalogSchema,
  updateDeviceCatalogSchema,
  deviceCatalogIdSchema,
  findMatchingDeviceCatalogSchema,
} from "./deviceCatalog.validator.js";

const router = express.Router();


// CUSTOMER / AUTHENTICATED USER
// GET ACTIVE DEVICE CATALOG

router.get(
  "/",
  protect,
  getActiveDeviceCatalogController
);


// FIND SPECIFIC DEVICE VARIANT

router.get(
  "/match",
  protect,
  validateRequest(
    findMatchingDeviceCatalogSchema
  ),
  findMatchingDeviceCatalogController
);


// ADMIN CREATE

router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(
    createDeviceCatalogSchema
  ),
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
  validateRequest(
    deviceCatalogIdSchema
  ),
  getDeviceCatalogByIdController
);


// ADMIN UPDATE

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateRequest(
    updateDeviceCatalogSchema
  ),
  updateDeviceCatalogController
);


// ADMIN DELETE

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateRequest(
    deviceCatalogIdSchema
  ),
  deleteDeviceCatalogController
);

export default router;