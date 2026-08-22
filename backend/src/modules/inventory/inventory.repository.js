import Inventory from "../../models/Inventory.js";

class InventoryRepository {
  async create(data) {
    const inventory =
      await Inventory.create(data);

    return this.findById(
      inventory._id
    );
  }

  async findById(id) {
    return Inventory.findById(id)
      .populate(
        "order"
      )
      .populate(
        "device"
      )
      .populate(
        "customer",
        "fullName email phone"
      )
      .populate(
        "createdBy",
        "fullName email"
      )
      .populate(
        "updatedBy",
        "fullName email"
      );
  }

  async findOne(filter) {
    return Inventory.findOne(filter)
      .populate("order")
      .populate("device")
      .populate(
        "customer",
        "fullName email phone"
      );
  }

  async findAll(
    filter = {},
    options = {}
  ) {
    const {
      page = 1,
      limit = 10,
    } = options;

    const skip =
      (page - 1) * limit;

    const [
      inventories,
      total,
    ] = await Promise.all([
      Inventory.find(filter)
        .populate(
          "order",
          "orderNumber status"
        )
        .populate(
          "device",
          "brand model variant color storage ram imei1 serialNumber status"
        )
        .populate(
          "customer",
          "fullName email phone"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Inventory.countDocuments(
        filter
      ),
    ]);

    return {
      inventories,
      total,
      page,
      limit,
      totalPages:
        Math.ceil(
          total / limit
        ),
    };
  }

  async updateById(
    id,
    updateData
  ) {
    return Inventory.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("order")
      .populate("device")
      .populate(
        "customer",
        "fullName email phone"
      );
  }

  async deleteById(id) {
    return Inventory.findByIdAndDelete(
      id
    );
  }
}

export default new InventoryRepository();