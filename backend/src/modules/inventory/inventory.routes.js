import express from "express";

import inventoryController from "./inventory.controller.js";

import protect from "../../middlewares/auth/protect.js";

import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";

import {
  createInventorySchema,
  inventoryIdSchema,
  updateInventorySchema,
  listInventorySchema,
  sellInventorySchema,
} from "./inventory.validator.js";

const router =
  express.Router();

router.use(
  protect,
  authorize("admin")
);

// Get all inventory

router.get(
  "/",
  inventoryController.getInventory
);

// Add device to inventory

router.post(
  "/",
  validateRequest(
    createInventorySchema
  ),
  inventoryController.createInventory
);

// Get inventory item

router.get(
  "/:id",
  validateRequest(
    inventoryIdSchema
  ),
  inventoryController.getInventoryById
);

// Update inventory

router.patch(
  "/:id",
  validateRequest(
    updateInventorySchema
  ),
  inventoryController.updateInventory
);

// List device

router.patch(
  "/:id/list",
  validateRequest(
    listInventorySchema
  ),
  inventoryController.listInventory
);

// Mark as sold

router.patch(
  "/:id/sold",
  validateRequest(
    sellInventorySchema
  ),
  inventoryController.sellInventory
);

// Remove from inventory

router.patch(
  "/:id/remove",
  validateRequest(
    inventoryIdSchema
  ),
  inventoryController.removeInventory
);

export default router;