import Order from "../../models/Order.js";

class OrderRepository {
  // COMMON POPULATE
  populateOrder(query) {
    return query
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

// CREATE ORDER
async create(orderData, session = null) {
  if (session) {
    const [order] = await Order.create(
      [orderData],
      { session }
    );

    return order;
  }

  return Order.create(orderData);
}

  // FIND ORDER BY ID
  async findById(orderId) {
    return this.populateOrder(
      Order.findById(orderId)
    );
  }

  // FIND ORDER BY ORDER NUMBER
  async findByOrderNumber(orderNumber) {
    return this.populateOrder(
      Order.findOne({
        orderNumber,
      })
    );
  }

  // FIND ALL ORDERS
  async findAll(
    filter = {},
    options = {}
  ) {
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
      Math.max(
        Number(limit) || 10,
        1
      ),
      100
    );

    const skip =
      (safePage - 1) * safeLimit;

    const ordersQuery =
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(safeLimit);

    const orders =
      await this.populateOrder(
        ordersQuery
      );

    const total =
      await Order.countDocuments(
        filter
      );

    return {
      orders,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages:
        Math.ceil(
          total / safeLimit
        ),
    };
  }

  // UPDATE ORDER
  async updateById(
    orderId,
    updateData
  ) {
    const query =
      Order.findByIdAndUpdate(
        orderId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    return this.populateOrder(query);
  }

  // DELETE ORDER
  async deleteById(orderId) {
    return Order.findByIdAndDelete(
      orderId
    );
  }

  // COUNT ORDERS
  async count(filter = {}) {
    return Order.countDocuments(
      filter
    );
  }
}

export default new OrderRepository();