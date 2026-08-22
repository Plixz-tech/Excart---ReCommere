import inventoryService from "./inventory.service.js";

class InventoryController {

  // GET ALL INVENTORY

  async getInventory(
    req,
    res,
    next
  ) {
    try {
      const result =
        await inventoryService.getInventory(
          req.query
        );

      return res.status(200).json({
        success: true,

        message:
          "Inventory fetched successfully.",

        data:
          result.inventories,

        pagination: {
          total:
            result.total,

          page:
            result.page,

          limit:
            result.limit,

          totalPages:
            result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET ONE INVENTORY

  async getInventoryById(
    req,
    res,
    next
  ) {
    try {
      const inventory =
        await inventoryService.getInventoryById(
          req.params.id
        );

      return res.status(200).json({
        success: true,

        message:
          "Inventory item fetched successfully.",

        data:
          inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  // CREATE INVENTORY

  async createInventory(
    req,
    res,
    next
  ) {
    try {
      const inventory =
        await inventoryService.createInventory(
          req.body,
          req.user.userId
        );

      return res.status(201).json({
        success: true,

        message:
          "Device added to inventory successfully.",

        data:
          inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  // UPDATE INVENTORY

  async updateInventory(
    req,
    res,
    next
  ) {
    try {
      const inventory =
        await inventoryService.updateInventory(
          req.params.id,
          req.body,
          req.user.userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Inventory updated successfully.",

        data:
          inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  // LIST DEVICE

  async listInventory(
    req,
    res,
    next
  ) {
    try {
      const inventory =
        await inventoryService.listInventory(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Device listed successfully.",

        data:
          inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  // SELL DEVICE

  async sellInventory(
    req,
    res,
    next
  ) {
    try {
      const inventory =
        await inventoryService.sellInventory(
          req.params.id,
          req.body,
          req.user.userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Device marked as sold successfully.",

        data:
          inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  // REMOVE DEVICE

  async removeInventory(
    req,
    res,
    next
  ) {
    try {
      const inventory =
        await inventoryService.removeInventory(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Device removed from inventory successfully.",

        data:
          inventory,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();