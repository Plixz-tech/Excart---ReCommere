import Inventory from "../../models/Inventory.js";

class InventoryRepository {
async create(data, session = null) {
  const inventory = await Inventory.create(
    [data],
    session ? { session } : undefined
  );

  return this.findById(
    inventory[0]._id,
    session
  );
}

async findById(id, session = null) {
  const query = Inventory.findById(id)
    .populate("order")
    .populate("device")
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

  if (session) {
    query.session(session);
  }

  return query;
}

async findOne(filter, session = null) {
  const query = Inventory.findOne(filter)
    .populate("order")
    .populate("device")
    .populate(
      "customer",
      "fullName email phone"
    );

  if (session) {
    query.session(session);
  }

  return query;
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
  updateData,
  session = null
) {
  const query = Inventory.findByIdAndUpdate(
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

  if (session) {
    query.session(session);
  }

  return query;
}

  async deleteById(id) {
    return Inventory.findByIdAndDelete(
      id
    );
  }
}

export default new InventoryRepository();