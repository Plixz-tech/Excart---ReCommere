import orderRepository from "./order.repository.js";
import Device from "../../models/Device.js";

class OrderService {
  async createOrder(data, userId) {
    const orderNumber =
      await this.generateOrderNumber();

    // Extract device-related data from the order request
    const {
      brand,
      model,
      variant,
      color,
      storage,
      ram,
      imei1,
      imei2,
      serialNumber,
      customerEvaluation,
      photos,
      pickup,
      estimatedAmount,
      notes,
    } = data;

    // 1. Check duplicate IMEI

    const existingDevice = await Device.findOne({
      $or: [
        { imei1 },
        ...(imei2 ? [{ imei2 }] : []),
      ],
      status: { $ne: "deleted" },
    });

    if (existingDevice) {
      const error = new Error(
        "A device with this IMEI already exists."
      );

      error.statusCode = 409;

      throw error;
    }

    // 2. Create Device

    const device = await Device.create({
      brand,
      model,
      variant,
      color,
      storage,
      ram,

      imei1,
      imei2,
      serialNumber,

      customerEvaluation:
        customerEvaluation || {},

      photos: photos || [],

      customer: userId,

      pickupAgent: null,
      inspectionAgent: null,

      status: "pending_pickup",

      purchasePrice: 0,
      expectedSellingPrice: 0,

      createdBy: userId,
      updatedBy: userId,
    });

    // 3. Create Order using Device ID

    const orderData = {
      orderNumber,

      customer: userId,

      agent: null,

      device: device._id,

      status: "pending",

      pickup: {
        ...(pickup || {}),
        status: "pending",
        assignedAgent: null,
        pickedUpAt: null,
      },

      payment: {
        estimatedAmount:
          estimatedAmount ?? 0,
        finalAmount: 0,
        status: "pending",
      },

      notes: notes || "",

      createdBy: userId,
      updatedBy: userId,
    };

    const order =
      await orderRepository.create(orderData);

    // 4. Return complete order with device information

    return orderRepository.findById(order._id);
  }

 
  // CUSTOMER ORDERS
 

  async getMyOrders(userId, query) {
    const {
      page = 1,
      limit = 10,
    } = query;

    const filter = {
      customer: userId,
    };

    return orderRepository.findAll(
      filter,
      {
        page: Number(page),
        limit: Number(limit),
      }
    );
  }

  async getMyOrderById(
    orderId,
    userId
  ) {
    const order =
      await orderRepository.findById(
        orderId
      );

    if (!order) {
      const error = new Error(
        "Order not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      order.customer._id.toString() !==
      userId.toString()
    ) {
      const error = new Error(
        "You are not authorized to view this order."
      );

      error.statusCode = 403;

      throw error;
    }

    return order;
  }

  async cancelOrder(
    orderId,
    userId
  ) {
    const order =
      await orderRepository.findById(
        orderId
      );

    if (!order) {
      const error = new Error(
        "Order not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      order.customer._id.toString() !==
      userId.toString()
    ) {
      const error = new Error(
        "You are not authorized to cancel this order."
      );

      error.statusCode = 403;

      throw error;
    }

    if (
      !["pending", "assigned"].includes(
        order.status
      )
    ) {
      const error = new Error(
        "This order cannot be cancelled."
      );

      error.statusCode = 400;

      throw error;
    }

    return orderRepository.updateById(
      orderId,
      {
        status: "cancelled",

        cancellationReason:
          "Cancelled by customer",

        updatedBy: userId,
      }
    );
  }

 
  // ADMIN ORDERS
 

  async getOrderById(orderId) {
    const order =
      await orderRepository.findById(
        orderId
      );

    if (!order) {
      const error = new Error(
        "Order not found"
      );

      error.statusCode = 404;

      throw error;
    }

    return order;
  }

  async getOrders(query) {
    const {
      page = 1,
      limit = 10,
      status,
      customer,
      agent,
    } = query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (customer) {
      filter.customer = customer;
    }

    if (agent) {
      filter.agent = agent;
    }

    return orderRepository.findAll(
      filter,
      {
        page: Number(page),
        limit: Number(limit),
      }
    );
  }

  async updateOrder(
    orderId,
    data,
    userId
  ) {
    const existingOrder =
      await orderRepository.findById(
        orderId
      );

    if (!existingOrder) {
      const error = new Error(
        "Order not found"
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      existingOrder.status ===
      "completed"
    ) {
      const error = new Error(
        "Completed orders cannot be modified"
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      existingOrder.status ===
      "cancelled"
    ) {
      const error = new Error(
        "Cancelled orders cannot be modified"
      );

      error.statusCode = 400;

      throw error;
    }

    const updateData = {
      ...data,
      updatedBy: userId,
    };

    return orderRepository.updateById(
      orderId,
      updateData
    );
  }

  async updateOrderStatus(
    orderId,
    status,
    userId
  ) {
    const existingOrder =
      await orderRepository.findById(
        orderId
      );

    if (!existingOrder) {
      const error = new Error(
        "Order not found"
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      existingOrder.status ===
      "completed"
    ) {
      const error = new Error(
        "Completed order status cannot be changed"
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      existingOrder.status ===
        "cancelled" &&
      status !== "cancelled"
    ) {
      const error = new Error(
        "Cancelled order status cannot be changed"
      );

      error.statusCode = 400;

      throw error;
    }

    return orderRepository.updateById(
      orderId,
      {
        status,
        updatedBy: userId,
      }
    );
  }

 
  // ADMIN ASSIGN ORDER TO AGENT
 

  async assignOrder(
    orderId,
    agentId,
    adminId
  ) {
    const existingOrder =
      await orderRepository.findById(
        orderId
      );

    if (!existingOrder) {
      const error = new Error(
        "Order not found"
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      existingOrder.status ===
      "completed"
    ) {
      const error = new Error(
        "Completed orders cannot be assigned"
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      existingOrder.status ===
      "cancelled"
    ) {
      const error = new Error(
        "Cancelled orders cannot be assigned"
      );

      error.statusCode = 400;

      throw error;
    }

    if (!existingOrder.device) {
      const error = new Error(
        "This order does not have a device."
      );

      error.statusCode = 400;

      throw error;
    }

    // Update Device

    const device =
      await Device.findById(
        existingOrder.device._id
      );

    if (!device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 404;

      throw error;
    }

    device.pickupAgent = agentId;
    device.updatedBy = adminId;

    await device.save();

    // Update Order

    const updateData = {
      agent: agentId,

      status: "assigned",

      "pickup.status": "assigned",

      "pickup.assignedAgent":
        agentId,

      updatedBy: adminId,
    };

    return orderRepository.updateById(
      orderId,
      updateData
    );
  }

 
  // AGENT ORDERS
 

  // Get all orders assigned to logged-in agent
  async getMyAssignedOrders(
    agentId,
    query
  ) {
    const {
      page = 1,
      limit = 10,
      status,
    } = query;

    const filter = {
      agent: agentId,
    };

    if (status) {
      filter.status = status;
    }

    return orderRepository.findAll(
      filter,
      {
        page: Number(page),
        limit: Number(limit),
      }
    );
  }

  // Get one specific order assigned to logged-in agent
  async getMyAssignedOrderById(
    orderId,
    agentId
  ) {
    const order =
      await orderRepository.findById(
        orderId
      );

    if (!order) {
      const error = new Error(
        "Order not found."
      );

      error.statusCode = 404;

      throw error;
    }

    // Make sure this order belongs
    // to the logged-in agent
    if (
      !order.agent ||
      order.agent._id.toString() !==
        agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to view this order."
      );

      error.statusCode = 403;

      throw error;
    }

    return order;
  }

 
  // DELETE ORDER
 

  async deleteOrder(orderId) {
    const existingOrder =
      await orderRepository.findById(
        orderId
      );

    if (!existingOrder) {
      const error = new Error(
        "Order not found"
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      [
        "completed",
        "payment_completed",
      ].includes(
        existingOrder.status
      )
    ) {
      const error = new Error(
        "This order cannot be deleted"
      );

      error.statusCode = 400;

      throw error;
    }

    return orderRepository.deleteById(
      orderId
    );
  }

 
   // AGENT PICKUP ORDER
  async pickupOrder(orderId, agentId) {
    const order =
      await orderRepository.findById(orderId);

    // 1. Check order exists
    if (!order) {
      const error = new Error(
        "Order not found."
      );

      error.statusCode = 404;

      throw error;
    }

    // 2. Make sure this order belongs to logged-in agent
    if (
      !order.agent ||
      order.agent._id.toString() !==
        agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to pick up this order."
      );

      error.statusCode = 403;

      throw error;
    }

    // 3. Check current order status
    if (order.status !== "assigned") {
      const error = new Error(
        `Order cannot be picked up because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    // 4. Check pickup status
if (
  order.pickup &&
  order.pickup.status === "completed"
) {
      const error = new Error(
        "Order has already been picked up."
      );

      error.statusCode = 400;

      throw error;
    }

    const pickedUpAt = new Date();

    // 5. Update device
    if (order.device) {
      const device =
        await Device.findById(order.device._id);

      if (!device) {
        const error = new Error(
          "Associated device not found."
        );

        error.statusCode = 404;

        throw error;
      }

      // Make sure the same agent is assigned to device
      device.pickupAgent = agentId;

      device.status = "picked_up";

      device.updatedBy = agentId;

      await device.save();
    }

    // 6. Update order
   const updateData = {
  status: "picked_up",

  "pickup.status": "completed",

  "pickup.assignedAgent": agentId,

  "pickup.pickedUpAt": pickedUpAt,

  updatedBy: agentId,
};

    // 7. Return updated order
    return orderRepository.updateById(
      orderId,
      updateData
    );
  }
 
  // ADMIN PROCESS PAYMENT

async processPayment(orderId, paymentData, adminId) {
  const order =
    await orderRepository.findById(orderId);

  // 1. Check order exists
  if (!order) {
    const error = new Error(
      "Order not found."
    );

    error.statusCode = 404;

    throw error;
  }

  // 2. Payment can only be processed after pickup
  if (order.status !== "picked_up") {
    const error = new Error(
      "Payment can only be processed after the device has been picked up."
    );

    error.statusCode = 400;

    throw error;
  }

  // 3. Check if already paid
  if (order.payment.status === "completed") {
    const error = new Error(
      "Payment has already been completed."
    );

    error.statusCode = 400;

    throw error;
  }

  // 4. Validate final amount
  if (
    paymentData.finalAmount === undefined ||
    paymentData.finalAmount === null ||
    paymentData.finalAmount < 0
  ) {
    const error = new Error(
      "Valid final amount is required."
    );

    error.statusCode = 400;

    throw error;
  }

  // 5. Update payment
  const updateData = {
    "payment.status": "completed",

    "payment.finalAmount":
      paymentData.finalAmount,

    "payment.paymentMethod":
      paymentData.paymentMethod,

    "payment.transactionId":
      paymentData.transactionId || "",

    "payment.paidAt": new Date(),

    "payment.notes":
      paymentData.notes || "",

    updatedBy: adminId,
  };

  return orderRepository.updateById(
    orderId,
    updateData
  );
}

  async generateOrderNumber() {
    const timestamp = Date.now();

    return `ORD-${timestamp}`;
  }

  // AGENT START TRANSIT
async startTransit(orderId, agentId) {
  const order =
    await orderRepository.findById(orderId);

  // 1. Check order exists
  if (!order) {
    const error = new Error(
      "Order not found."
    );

    error.statusCode = 404;
    throw error;
  }

  // 2. Make sure this order belongs to the agent
  if (
    !order.agent ||
    order.agent._id.toString() !==
      agentId.toString()
  ) {
    const error = new Error(
      "You are not authorized to start transit for this order."
    );

    error.statusCode = 403;
    throw error;
  }

  // 3. Order must already be picked up
  if (order.status !== "picked_up") {
    const error = new Error(
      `Order cannot be moved to transit because its current status is "${order.status}".`
    );

    error.statusCode = 400;
    throw error;
  }

  // 4. Make sure device exists
  if (!order.device) {
    const error = new Error(
      "Associated device not found."
    );

    error.statusCode = 400;
    throw error;
  }

  // 5. Update device
  const device =
    await Device.findById(order.device._id);

  if (!device) {
    const error = new Error(
      "Associated device not found."
    );

    error.statusCode = 404;
    throw error;
  }

  device.status = "in_transit";
  device.updatedBy = agentId;

  await device.save();

  // 6. Update order
  const updateData = {
    status: "in_transit",

    updatedBy: agentId,

    $push: {
      timeline: {
        status: "in_transit",
        message:
          "Device is in transit to the store.",
        performedBy: agentId,
      },
    },
  };

  return orderRepository.updateById(
    orderId,
    updateData
  );
}

// ADMIN RECEIVE DEVICE
async receiveOrder(orderId, adminId) {
  const order =
    await orderRepository.findById(orderId);

  // 1. Check order exists
  if (!order) {
    const error = new Error(
      "Order not found."
    );

    error.statusCode = 404;
    throw error;
  }

  // 2. Order must be in transit
  if (order.status !== "in_transit") {
    const error = new Error(
      `Order cannot be received because its current status is "${order.status}".`
    );

    error.statusCode = 400;
    throw error;
  }

  // 3. Make sure device exists
  if (!order.device) {
    const error = new Error(
      "Associated device not found."
    );

    error.statusCode = 400;
    throw error;
  }

  // 4. Find device
  const device =
    await Device.findById(order.device._id);

  if (!device) {
    const error = new Error(
      "Associated device not found."
    );

    error.statusCode = 404;
    throw error;
  }

  // 5. Update device
  device.status = "received_in_shop";
  device.updatedBy = adminId;

  await device.save();

  // 6. Update order
  const updateData = {
    status: "inspection_pending",

    "inspection.status": "pending",

    updatedBy: adminId,

    $push: {
      timeline: {
        status: "inspection_pending",
        message:
          "Device received at store. Inspection is pending.",
        performedBy: adminId,
      },
    },
  };

  // 7. Return updated order
  return orderRepository.updateById(
    orderId,
    updateData
  );
}
}




export default new OrderService();