import inventoryRepository from "./inventory.repository.js";

import Inventory from "../../models/Inventory.js";

import Order from "../../models/Order.js";

import Device from "../../models/Device.js";

class InventoryService {


  // GET ALL INVENTORY


  async getInventory(query) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
    } = query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const result =
      await inventoryRepository.findAll(
        filter,
        {
          page: Number(page),
          limit: Number(limit),
        }
      );

    // Optional search filtering can be
    // implemented at database level later.

    if (search) {
      const searchTerm =
        search.toLowerCase();

      result.inventories =
        result.inventories.filter(
          (item) => {
            const device =
              item.device;

            const order =
              item.order;

            return (
              device?.brand
                ?.toLowerCase()
                .includes(
                  searchTerm
                ) ||
              device?.model
                ?.toLowerCase()
                .includes(
                  searchTerm
                ) ||
              order?.orderNumber
                ?.toLowerCase()
                .includes(
                  searchTerm
                )
            );
          }
        );
    }

    return result;
  }


  // GET INVENTORY BY ID


  async getInventoryById(
    inventoryId
  ) {
    const inventory =
      await inventoryRepository.findById(
        inventoryId
      );

    if (!inventory) {
      const error = new Error(
        "Inventory item not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return inventory;
  }


  // ADD DEVICE TO INVENTORY


  async createInventory(
    data,
    adminId
  ) {
    const {
      orderId,
      listedPrice,
      notes,
    } = data;

    // 1. Find order

    const order =
      await Order.findById(
        orderId
      )
        .populate("device")
        .populate("customer");

    if (!order) {
      const error = new Error(
        "Order not found."
      );

      error.statusCode = 404;

      throw error;
    }

    // 2. Make sure device exists

    if (!order.device) {
      const error = new Error(
        "This order does not have an associated device."
      );

      error.statusCode = 400;

      throw error;
    }

    // 3. Payment must be completed

    if (
      order.payment?.status !==
      "completed"
    ) {
      const error = new Error(
        "Device cannot be added to inventory before payment is completed."
      );

      error.statusCode = 400;

      throw error;
    }

    // 4. Inspection must be completed

    if (
      order.inspection?.status !==
      "completed"
    ) {
      const error = new Error(
        "Device cannot be added to inventory before inspection is completed."
      );

      error.statusCode = 400;

      throw error;
    }

    // 5. Prevent duplicate inventory

    const existingInventory =
      await inventoryRepository.findOne(
        {
          order: orderId,
        }
      );

    if (existingInventory) {
      const error = new Error(
        "This order is already added to inventory."
      );

      error.statusCode = 409;

      throw error;
    }

    // 6. Create inventory

    const inventoryData = {
      order: order._id,

      device:
        order.device._id,

      customer:
        order.customer._id,

      purchasePrice:
        order.payment.finalAmount,

      listedPrice,

      status: "draft",

      notes:
        notes || "",

      createdBy:
        adminId,

      updatedBy:
        adminId,
    };

    const inventory =
      await inventoryRepository.create(
        inventoryData
      );

    // 7. Update device

    await Device.findByIdAndUpdate(
      order.device._id,
      {
        expectedSellingPrice:
          listedPrice,

        status:
          "inventory",

        updatedBy:
          adminId,
      }
    );

    // 8. Update order

    await Order.findByIdAndUpdate(
      orderId,
      {
        "inventory.status":
          "draft",

        "inventory.inventoryId":
          inventory._id,

        "inventory.listedPrice":
          listedPrice,

        updatedBy:
          adminId,
      }
    );

    return inventoryRepository.findById(
      inventory._id
    );
  }


  // UPDATE INVENTORY


  async updateInventory(
    inventoryId,
    data,
    adminId
  ) {
    const inventory =
      await inventoryRepository.findById(
        inventoryId
      );

    if (!inventory) {
      const error = new Error(
        "Inventory item not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      inventory.status ===
      "sold"
    ) {
      const error = new Error(
        "Sold inventory cannot be modified."
      );

      error.statusCode = 400;

      throw error;
    }

    const updateData = {
      ...data,

      updatedBy:
        adminId,
    };

    const updatedInventory =
      await inventoryRepository.updateById(
        inventoryId,
        updateData
      );

    // Update device selling price

    if (
      data.listedPrice !==
      undefined
    ) {
      await Device.findByIdAndUpdate(
        inventory.device._id,
        {
          expectedSellingPrice:
            data.listedPrice,

          updatedBy:
            adminId,
        }
      );

      await Order.findByIdAndUpdate(
        inventory.order._id,
        {
          "inventory.listedPrice":
            data.listedPrice,

          updatedBy:
            adminId,
        }
      );
    }

    return updatedInventory;
  }


  // LIST DEVICE


  async listInventory(
    inventoryId,
    adminId
  ) {
    const inventory =
      await inventoryRepository.findById(
        inventoryId
      );

    if (!inventory) {
      const error = new Error(
        "Inventory item not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      inventory.status ===
      "sold"
    ) {
      const error = new Error(
        "Sold inventory cannot be listed."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      inventory.listedPrice <= 0
    ) {
      const error = new Error(
        "Listed price must be greater than 0 before listing the device."
      );

      error.statusCode = 400;

      throw error;
    }

    const listedAt =
      new Date();

    const updatedInventory =
      await inventoryRepository.updateById(
        inventoryId,
        {
          status:
            "listed",

          listedAt,

          updatedBy:
            adminId,
        }
      );

    // Update order

    await Order.findByIdAndUpdate(
      inventory.order._id,
      {
        "inventory.status":
          "listed",

        "inventory.listedPrice":
          inventory.listedPrice,

        updatedBy:
          adminId,
      }
    );

    // Update device

    await Device.findByIdAndUpdate(
      inventory.device._id,
      {
        status:
          "listed",

        expectedSellingPrice:
          inventory.listedPrice,

        updatedBy:
          adminId,
      }
    );

    return updatedInventory;
  }


  // MARK AS SOLD


  async sellInventory(
    inventoryId,
    data,
    adminId
  ) {
    const {
      soldPrice,
      soldTo,
      notes,
    } = data;

    const inventory =
      await inventoryRepository.findById(
        inventoryId
      );

    if (!inventory) {
      const error = new Error(
        "Inventory item not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      inventory.status !==
      "listed"
    ) {
      const error = new Error(
        "Only listed devices can be marked as sold."
      );

      error.statusCode = 400;

      throw error;
    }

    const soldAt =
      new Date();

    const updatedInventory =
      await inventoryRepository.updateById(
        inventoryId,
        {
          status:
            "sold",

          soldPrice,

          soldAt,

          soldTo:
            soldTo || null,

          notes:
            notes ||
            inventory.notes,

          updatedBy:
            adminId,
        }
      );

    // Update order

    await Order.findByIdAndUpdate(
      inventory.order._id,
      {
        "inventory.status":
          "sold",

        "inventory.soldPrice":
          soldPrice,

        "inventory.soldAt":
          soldAt,

        status:
          "completed",

        updatedBy:
          adminId,
      }
    );

    // Update device

    await Device.findByIdAndUpdate(
      inventory.device._id,
      {
        status:
          "sold",

        updatedBy:
          adminId,
      }
    );

    return updatedInventory;
  }


  // REMOVE FROM INVENTORY


  async removeInventory(
    inventoryId,
    adminId
  ) {
    const inventory =
      await inventoryRepository.findById(
        inventoryId
      );

    if (!inventory) {
      const error = new Error(
        "Inventory item not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      inventory.status ===
      "sold"
    ) {
      const error = new Error(
        "Sold inventory cannot be removed."
      );

      error.statusCode = 400;

      throw error;
    }

    const updatedInventory =
      await inventoryRepository.updateById(
        inventoryId,
        {
          status:
            "removed",

          updatedBy:
            adminId,
        }
      );

    await Device.findByIdAndUpdate(
      inventory.device._id,
      {
        status:
          "removed",

        updatedBy:
          adminId,
      }
    );

    return updatedInventory;
  }
}

export default new InventoryService();