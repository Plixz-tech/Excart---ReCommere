import express from "express";

import inventoryController from "./inventory.controller.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

import {
  createInventorySchema,
  inventoryIdSchema,
  updateInventorySchema,
  listInventorySchema,
  sellInventorySchema,
} from "./inventory.validator.js";

const router = express.Router();

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
  validateRequest(createInventorySchema),
  inventoryController.createInventory
);

// Get inventory item
router.get(
  "/:id",
  validateParams(inventoryIdSchema),
  inventoryController.getInventoryById
);

// Update inventory
router.patch(
  "/:id",
  validateParams(inventoryIdSchema),
  validateRequest(updateInventorySchema),
  inventoryController.updateInventory
);

// List device
router.patch(
  "/:id/list",
  validateParams(inventoryIdSchema),
  validateRequest(listInventorySchema),
  inventoryController.listInventory
);

// Mark as sold
router.patch(
  "/:id/sold",
  validateParams(inventoryIdSchema),
  validateRequest(sellInventorySchema),
  inventoryController.sellInventory
);

// Remove from inventory
router.patch(
  "/:id/remove",
  validateParams(inventoryIdSchema),
  inventoryController.removeInventory
);

export default router;