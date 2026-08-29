import Order from "../../models/Order.js";

class OrderRepository {

  async create(orderData) {
    return Order.create(orderData);
  }

  async findById(orderId) {
    return Order.findById(orderId)
      .populate(
        "customer",
        "fullName phone email"
      )
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "pickup.assignedAgent",
        "fullName phone email agentProfile.agentId"
      )
      .populate("device")
      .populate(
        "createdBy",
        "fullName email"
      )
      .populate(
        "updatedBy",
        "fullName email"
      );
  }

  async findByOrderNumber(orderNumber) {
    return Order.findOne({
      orderNumber,
    })
      .populate(
        "customer",
        "fullName phone email"
      )
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "pickup.assignedAgent",
        "fullName phone email agentProfile.agentId"
      )
      .populate("device");
  }

  async findAll(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = {
        createdAt: -1,
      },
    } = options;

    const safePage = Math.max(
      Number(page) || 1,
      1
    );

    const safeLimit = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const skip =
      (safePage - 1) * safeLimit;

    const [orders, total] =
      await Promise.all([
        Order.find(filter)
          .populate(
            "customer",
            "fullName phone email"
          )
          .populate(
            "agent",
            "fullName phone email agentProfile.agentId"
          )
          .populate(
            "pickup.assignedAgent",
            "fullName phone email agentProfile.agentId"
          )
          .populate("device")
          .populate(
            "createdBy",
            "fullName email"
          )
          .populate(
            "updatedBy",
            "fullName email"
          )
          .sort(sort)
          .skip(skip)
          .limit(safeLimit),

        Order.countDocuments(filter),
      ]);

    return {
      orders,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages:
        Math.ceil(total / safeLimit),
    };
  }

  async updateById(
    orderId,
    updateData
  ) {
    return Order.findByIdAndUpdate(
      orderId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "customer",
        "fullName phone email"
      )
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "pickup.assignedAgent",
        "fullName phone email agentProfile.agentId"
      )
      .populate("device")
      .populate(
        "createdBy",
        "fullName email"
      )
      .populate(
        "updatedBy",
        "fullName email"
      );
  }

  async deleteById(orderId) {
    return Order.findByIdAndDelete(orderId);
  }

  async count(filter = {}) {
    return Order.countDocuments(filter);
  }
}

export default new OrderRepository();