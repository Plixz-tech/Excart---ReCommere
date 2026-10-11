import mongoose from "mongoose";
import orderRepository from "./order.repository.js";
import Device from "../../models/Device.js";
import DeviceCatalog from "../../models/DeviceCatalog.js";
import AgentEarning from "../../models/AgentEarning.js";
import User from "../../models/User.js";
import { generateGoogleMapsUrl } from "../../lib/googleMaps.js";
import { uploadBufferToCloudinary } from "../../lib/uploadBuffer.js";
import * as verificationService from "../../services/verification/verification.service.js";
import notificationService from "../notification/notification.service.js";
import auditLogger from "../../utils/audit/auditLogger.js";
import { calculatePrice } from "../pricingRule/pricingRule.service.js";

// ExCart currently operates in India.
// Pickup date/time received from the frontend is treated as IST.

const buildPickupDateTime = (
  scheduledDate,
  scheduledTime
) => {
  const pickupDate = new Date(
    `${scheduledDate}T${scheduledTime}:00+05:30`
  );

  if (Number.isNaN(pickupDate.getTime())) {
    const error = new Error(
      "Invalid pickup date or time."
    );

    error.statusCode = 400;

    throw error;
  }

  return pickupDate;
};



// ORDER STATUS TRANSITIONS


const allowedStatusTransitions = {
  pending: [
    "pickup_scheduled",
    "assigned",
    "cancelled",
    "rejected",
  ],

  pickup_scheduled: [
    "assigned",
    "cancelled",
    "rejected",
  ],

  assigned: [
    "cancelled",
    "rejected",
  ],

  picked_up: [
    "payment_pending",
  ],

  payment_pending: [
    "payment_completed",
    "rejected",
  ],

  payment_completed: [
    "in_transit",
  ],

  in_transit: [
    "inspection_pending",
  ],

  inspection_pending: [
    "inspection_in_progress",
    "rejected",
  ],

  inspection_in_progress: [
    "inspection_completed",
    "rejected",
  ],

  inspection_completed: [
    "approved",
    "rejected",
  ],

  approved: [
    "ready_stock",
  ],

  ready_stock: [
    "completed",
  ],

  rejected: [],

  cancelled: [],

  completed: [],
};

const validateStatusTransition = (
  currentStatus,
  nextStatus
) => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowed =
    allowedStatusTransitions[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    const error = new Error(
      `Order cannot move from "${currentStatus}" to "${nextStatus}".`
    );

    error.statusCode = 400;

    throw error;
  }
};


class OrderService {



  // CUSTOMER CREATE ORDER


  async createOrder(data, userId) {
    const {
      deviceCatalogId,
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

    if (!pickup) {
      const error = new Error(
        "Pickup details are required."
      );

      error.statusCode = 400;

      throw error;
    }

    if (!pickup.scheduledDate) {
      const error = new Error(
        "Pickup date is required."
      );

      error.statusCode = 400;

      throw error;
    }

    if (!pickup.scheduledTime) {
      const error = new Error(
        "Pickup time is required."
      );

      error.statusCode = 400;

      throw error;
    }

    const pickupDate =
      buildPickupDateTime(
        pickup.scheduledDate,
        pickup.scheduledTime
      );

    if (pickupDate <= new Date()) {
      const error = new Error(
        "Pickup date and time must be in the future."
      );

      error.statusCode = 400;

      throw error;
    }

    const orderNumber =
      await this.generateOrderNumber();

    const existingDevice =
      await Device.findOne({
        $or: [
          { imei1 },
          ...(imei2
            ? [{ imei2 }]
            : []),
        ],
        status: {
          $ne: "deleted",
        },
      });

    if (existingDevice) {
      const error = new Error(
        "A device with this IMEI already exists."
      );

      error.statusCode = 409;

      throw error;
    }

    if (!deviceCatalogId) {
      throw new ApiError(
        400,
        "Device Catalog ID is required."
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        deviceCatalogId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid Device Catalog ID."
      );
    }

    const catalogDevice =
      await DeviceCatalog.findOne({
        _id: deviceCatalogId,
        active: true,
      });

    if (!catalogDevice) {
      throw new ApiError(
        404,
        "Device catalog item not found."
      );
    }

    const agentCommission =
      catalogDevice.agentCommission;

    const pricingResult =
      await calculatePrice({
        deviceCatalogId,
        evaluation:
          customerEvaluation || {},
      });

    const device =
      await Device.create({
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

        photos:
          photos || [],

        customer:
          userId,

        pickupAgent:
          null,

        inspectionAgent:
          null,

        status:
          "pending_pickup",

        agentCommission,

        deviceCatalogId,

        valuationPrice:
          catalogDevice.valuationPrice,

        purchasePrice:
          0,

        expectedSellingPrice:
          0,

        createdBy:
          userId,

        updatedBy:
          userId,
      });

    const mapsUrl =
      generateGoogleMapsUrl(
        pickup.address
      );

    const orderData = {
      orderNumber,

      customer:
        userId,

      agent:
        null,

      agentCommission:
        Number(agentCommission ?? 0),

      device:
        device._id,

      status:
        "pickup_scheduled",

      pickup: {
        ...pickup,

        status:
          "scheduled",

        scheduledDate:
          pickupDate,

        scheduledTime:
          pickup.scheduledTime,

        assignedAgent:
          null,

        mapsUrl,

        pickedUpAt:
          null,
      },

      payment: {
        estimatedAmount:
          pricingResult.finalPrice,

        finalAmount:
          0,

        status:
          "pending",
      },

      notes:
        notes || "",

      createdBy:
        userId,

      updatedBy:
        userId,
    };

    const order =
      await orderRepository.create(
        orderData
      );

    await auditLogger({
      actor: userId,
      action: "ORDER_CREATED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Order ${order.orderNumber} was created.`,
      newValue: {
        status:
          order.status,

        orderNumber:
          order.orderNumber,
      },
    });

    try {
      await notificationService.createNotification({
        recipient:
          userId,

        title:
          "Order Confirmed",

        message:
          `Your order ${order.orderNumber} has been created successfully.`,

        type:
          "order_created",

        order:
          order._id,
      });
    } catch (error) {
      console.error(
        "Failed to create order notification:",
        error
      );
    }

    return orderRepository.findById(
      order._id
    );
  }


  // CUSTOMER UPLOAD DEVICE INVOICE


  async uploadDeviceInvoice(
    orderId,
    file,
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
      !order.customer ||
      order.customer._id.toString() !==
      userId.toString()
    ) {
      const error = new Error(
        "You are not authorized to upload invoice for this order."
      );

      error.statusCode = 403;

      throw error;
    }

    if (!file) {
      const error = new Error(
        "Device invoice file is required."
      );

      error.statusCode = 400;

      throw error;
    }

    const uploadedFile =
      await uploadBufferToCloudinary(
        file.buffer,
        {
          folder:
            `excart/orders/${orderId}/device-invoice`,

          resource_type:
            "auto",
        }
      );

    const invoiceDocument = {
      type:
        "device_invoice",

      url:
        uploadedFile.secure_url ||
        uploadedFile.url ||
        "",

      publicId:
        uploadedFile.public_id ||
        "",

      fileName:
        file.originalname ||
        "",

      uploadedBy:
        userId,

      uploadedAt:
        new Date(),
    };

    return orderRepository.updateById(
      orderId,
      {
        $push: {
          documents:
            invoiceDocument,
        },

        updatedBy:
          userId,
      }
    );
  }



  // CUSTOMER ORDERS


  async getMyOrders(
    userId,
    query
  ) {
    const {
      page = 1,
      limit = 10,
    } = query;

    return orderRepository.findAll(
      {
        customer:
          userId,
      },
      {
        page:
          Number(page),

        limit:
          Number(limit),
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
      !order.customer ||
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



  // CUSTOMER CANCEL ORDER


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
      !order.customer ||
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
      ![
        "pending",
        "pickup_scheduled",
        "assigned",
      ].includes(order.status)
    ) {
      const error = new Error(
        "This order cannot be cancelled."
      );

      error.statusCode = 400;

      throw error;
    }

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          status:
            "cancelled",

          cancellationReason:
            "Cancelled by customer",

          updatedBy:
            userId,

          $push: {
            timeline: {
              status:
                "cancelled",

              message:
                "Order cancelled by customer.",

              performedBy:
                userId,
            },
          },
        }
      );

    await auditLogger({
      actor: userId,
      action: "ORDER_CANCELLED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description: `Order ${order.orderNumber} was cancelled by the customer.`,
      oldValue: {
        status: order.status,
      },
      newValue: {
        status: updatedOrder.status,
        cancellationReason: "Cancelled by customer",
      },
    });

    try {
      await notificationService.createNotification({
        recipient:
          userId,

        title:
          "Order Cancelled",

        message:
          `Your order ${order.orderNumber} has been cancelled successfully.`,

        type:
          "order_status",

        order:
          order._id,
      });
    } catch (error) {
      console.error(
        "Failed to create cancellation notification:",
        error
      );
    }

    return updatedOrder;
  }



  // CUSTOMER RESCHEDULE PICKUP


  async reschedulePickup(
    orderId,
    data,
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
      !order.customer ||
      order.customer._id.toString() !==
      userId.toString()
    ) {
      const error = new Error(
        "You are not authorized to reschedule this order."
      );

      error.statusCode = 403;

      throw error;
    }

    if (
      ![
        "pending",
        "pickup_scheduled",
        "assigned",
      ].includes(order.status)
    ) {
      const error = new Error(
        "This order cannot be rescheduled after pickup has started."
      );

      error.statusCode = 400;

      throw error;
    }

    const {
      scheduledDate,
      scheduledTime,
    } = data;

    const requestedPickup =
      buildPickupDateTime(
        scheduledDate,
        scheduledTime
      );

    if (
      requestedPickup <= new Date()
    ) {
      const error = new Error(
        "Pickup date and time must be in the future."
      );

      error.statusCode = 400;

      throw error;
    }

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          status:
            "pickup_scheduled",

          "pickup.status":
            "scheduled",

          "pickup.scheduledDate":
            requestedPickup,

          "pickup.scheduledTime":
            scheduledTime,

          updatedBy:
            userId,

          $push: {
            timeline: {
              status:
                "pickup_rescheduled",

              message:
                `Pickup rescheduled to ${scheduledDate} at ${scheduledTime}.`,

              performedBy:
                userId,
            },
          },
        }
      );

    await auditLogger({
      actor: userId,
      action: "PICKUP_RESCHEDULED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Pickup for order ${order.orderNumber} was rescheduled.`,
      oldValue: {
        scheduledDate:
          order.pickup?.scheduledDate,
        scheduledTime:
          order.pickup?.scheduledTime,
      },
      newValue: {
        scheduledDate,
        scheduledTime,
      },
    });

    try {
      await notificationService.createNotification({
        recipient:
          userId,

        title:
          "Pickup Rescheduled",

        message:
          `Your pickup for order ${order.orderNumber} has been rescheduled to ${scheduledDate} at ${scheduledTime}.`,

        type:
          "pickup_rescheduled",

        order:
          order._id,
      });
    } catch (error) {
      console.error(
        "Failed to create reschedule notification:",
        error
      );
    }

    return updatedOrder;
  }



  // ADMIN GET ORDERS


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
      filter.status =
        status;
    }

    if (customer) {
      filter.customer =
        customer;
    }

    if (agent) {
      filter.agent =
        agent;
    }

    return orderRepository.findAll(
      filter,
      {
        page:
          Number(page),

        limit:
          Number(limit),
      }
    );
  }


  async getOrderById(
    orderId
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

    return order;
  }



  // ADMIN UPDATE ORDER


  async updateOrder(
    orderId,
    data,
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
      [
        "completed",
        "cancelled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `${order.status} orders cannot be modified.`
      );

      error.statusCode = 400;

      throw error;
    }

    const updateData = {
      updatedBy:
        userId,
    };


    // DEVICE


    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "device"
      )
    ) {
      updateData.device =
        data.device;
    }


    // PICKUP


    if (data.pickup) {
      if (
        Object.prototype.hasOwnProperty.call(
          data.pickup,
          "status"
        )
      ) {
        updateData["pickup.status"] =
          data.pickup.status;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data.pickup,
          "scheduledDate"
        )
      ) {
        updateData["pickup.scheduledDate"] =
          buildPickupDateTime(
            data.pickup.scheduledDate,
            data.pickup.scheduledTime ||
            order.pickup?.scheduledTime
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data.pickup,
          "scheduledTime"
        )
      ) {
        updateData["pickup.scheduledTime"] =
          data.pickup.scheduledTime;
      }

      if (data.pickup.address) {
        if (
          Object.prototype.hasOwnProperty.call(
            data.pickup.address,
            "line1"
          )
        ) {
          updateData["pickup.address.line1"] =
            data.pickup.address.line1;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            data.pickup.address,
            "city"
          )
        ) {
          updateData["pickup.address.city"] =
            data.pickup.address.city;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            data.pickup.address,
            "state"
          )
        ) {
          updateData["pickup.address.state"] =
            data.pickup.address.state;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            data.pickup.address,
            "pinCode"
          )
        ) {
          updateData["pickup.address.pinCode"] =
            data.pickup.address.pinCode;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            data.pickup.address,
            "latitude"
          )
        ) {
          updateData["pickup.address.latitude"] =
            data.pickup.address.latitude;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            data.pickup.address,
            "longitude"
          )
        ) {
          updateData["pickup.address.longitude"] =
            data.pickup.address.longitude;
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data.pickup,
          "notes"
        )
      ) {
        updateData["pickup.notes"] =
          data.pickup.notes;
      }
    }


    // PAYMENT


    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "estimatedAmount"
      )
    ) {
      updateData[
        "payment.estimatedAmount"
      ] = data.estimatedAmount;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "finalAmount"
      )
    ) {
      updateData[
        "payment.finalAmount"
      ] = data.finalAmount;
    }


    // NOTES


    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "notes"
      )
    ) {
      updateData.notes =
        data.notes;
    }

    return orderRepository.updateById(
      orderId,
      updateData
    );
  }



  // ADMIN UPDATE STATUS


  async updateOrderStatus(
    orderId,
    status,
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

    validateStatusTransition(
      order.status,
      status
    );

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          status,

          updatedBy:
            userId,

          $push: {
            timeline: {
              status,

              message:
                `Order status changed to ${status}.`,

              performedBy:
                userId,
            },
          },
        }
      );

    await auditLogger({
      actor: userId,
      action: "ORDER_STATUS_UPDATED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Order ${order.orderNumber} status changed from ${order.status} to ${status}.`,
      oldValue: {
        status: order.status,
      },
      newValue: {
        status,
      },
    });

    try {
      await notificationService.createNotification({
        recipient:
          order.customer._id ||
          order.customer,

        title:
          "Order Status Updated",

        message:
          `Your order ${order.orderNumber} is now ${status.replaceAll("_", " ")}.`,

        type:
          "order_status",

        order:
          order._id,
      });
    } catch (error) {
      console.error(
        "Failed to create status notification:",
        error
      );
    }

    return updatedOrder;
  }


  // ADMIN ASSIGN ORDER


  async assignOrder(
    orderId,
    agentId,
    adminId
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
      ![
        "pending",
        "pickup_scheduled",
        "assigned",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Order cannot be assigned because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const agent =
      await User.findById(
        agentId
      );

    if (!agent) {
      const error = new Error(
        "Agent not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      agent.role !==
      "agent"
    ) {
      const error = new Error(
        "Selected user is not an agent."
      );

      error.statusCode = 400;

      throw error;
    }

    if (!order.device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    const device =
      await Device.findById(
        order.device._id
      );

    if (!device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 404;

      throw error;
    }

    device.pickupAgent =
      agentId;

    device.updatedBy =
      adminId;

    await device.save();

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          agent:
            agentId,

          status:
            "assigned",

          "pickup.status":
            "scheduled",

          "pickup.assignedAgent":
            agentId,

          updatedBy:
            adminId,

          $push: {
            timeline: {
              status:
                "assigned",

              message:
                "Order assigned to an agent.",

              performedBy:
                adminId,
            },
          },
        }
      );

    await auditLogger({
      actor: adminId,
      action: "ORDER_AGENT_ASSIGNED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Order ${order.orderNumber} was assigned to agent ${agent.fullName || agentId}.`,
      oldValue: {
        agent:
          order.agent?._id ||
          order.agent ||
          null,
        status:
          order.status,
      },
      newValue: {
        agent:
          agentId,
        status:
          "assigned",
      },
      metadata: {
        agentId:
          agentId.toString(),
        agentName:
          agent.fullName || "",
      },
    });

    try {
      await notificationService.createNotification({
        recipient:
          order.customer._id ||
          order.customer,

        title:
          "Pickup Agent Assigned",

        message:
          `An agent has been assigned to your order ${order.orderNumber}.`,

        type:
          "pickup_assigned",

        order:
          order._id,

        metadata: {
          agentId:
            agentId.toString(),

          agentName:
            agent.fullName || "",
        },
      });
    } catch (error) {
      console.error(
        "Failed to create agent assignment notification:",
        error
      );
    }

    try {
      await notificationService.createNotification({
        recipient:
          agentId,

        title:
          "New Pickup Assigned",

        message:
          `You have been assigned to pickup order ${order.orderNumber}.`,

        type:
          "pickup_assigned",

        order:
          order._id,

        metadata: {
          orderNumber:
            order.orderNumber,
        },
      });
    } catch (error) {
      console.error(
        "Failed to create agent notification:",
        error
      );
    }

    return updatedOrder;
  }

  // AGENT GET ASSIGNED ORDERS


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
      agent:
        agentId,
    };

    if (status) {
      filter.status =
        status;
    }

    return orderRepository.findAll(
      filter,
      {
        page:
          Number(page),

        limit:
          Number(limit),
      }
    );
  }


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

    const mapsUrl =
      generateGoogleMapsUrl(
        order.pickup?.address
      );

    return {
      ...order.toObject(),

      navigation: {
        googleMapsUrl:
          mapsUrl,
      },
    };
  }



  // AGENT SELF ASSIGN


  async selfAssignOrder(
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

    if (
      order.agent ||
      order.pickup?.assignedAgent
    ) {
      const assignedAgentId =
        order.agent?._id ||
        order.pickup?.assignedAgent;

      const error = new Error(
        assignedAgentId?.toString() ===
          agentId.toString()
          ? "You have already accepted this order."
          : "This order is already assigned to another agent."
      );

      error.statusCode = 409;

      throw error;
    }

    if (
      ![
        "pending",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Order cannot be self-assigned because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const agent =
      await User.findById(
        agentId
      );

    if (!agent) {
      const error = new Error(
        "Agent not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      agent.role !==
      "agent"
    ) {
      const error = new Error(
        "Only an agent can self-assign an order."
      );

      error.statusCode = 403;

      throw error;
    }

    if (!order.device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    const device =
      await Device.findById(
        order.device._id
      );

    if (!device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 404;

      throw error;
    }

    device.pickupAgent =
      agentId;

    device.updatedBy =
      agentId;

    await device.save();

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          agent:
            agentId,

          "pickup.assignedAgent":
            agentId,

          "pickup.status":
            "scheduled",

          status:
            "assigned",

          updatedBy:
            agentId,

          $push: {
            timeline: {
              status:
                "assigned",

              message:
                "Agent accepted the pickup request.",

              performedBy:
                agentId,
            },
          },
        }
      );

    await auditLogger({
      actor: agentId,
      action: "ORDER_SELF_ASSIGNED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Agent ${agent.fullName || agentId} accepted pickup order ${order.orderNumber}.`,
      oldValue: {
        agent:
          order.agent?._id ||
          order.agent ||
          null,
        status:
          order.status,
      },
      newValue: {
        agent:
          agentId,
        status:
          "assigned",
      },
      metadata: {
        agentId:
          agentId.toString(),
        agentName:
          agent.fullName || "",
      },
    });

    try {
      await notificationService.createNotification({
        recipient:
          order.customer._id ||
          order.customer,

        title:
          "Pickup Agent Assigned",

        message:
          `An agent has accepted your pickup request for order ${order.orderNumber}.`,

        type:
          "pickup_assigned",

        order:
          order._id,

        metadata: {
          agentId:
            agentId.toString(),

          agentName:
            agent.fullName || "",
        },
      });
    } catch (error) {
      console.error(
        "Failed to create self-assignment notification:",
        error
      );
    }

    try {
      await notificationService.createNotification({
        recipient:
          agentId,

        title:
          "Pickup Accepted",

        message:
          `You have accepted pickup order ${order.orderNumber}.`,

        type:
          "pickup_assigned",

        order:
          order._id,
      });
    } catch (error) {
      console.error(
        "Failed to create agent self-assignment notification:",
        error
      );
    }

    return updatedOrder;
  }

  // UPDATE AGENT DEVICE CONDITION / PHYSICAL INSPECTION

  async updateAgentDeviceCondition(
    orderId,
    agentId,
    conditionData
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

    // Only the assigned agent can update
    // the device condition.
    if (
      !order.agent ||
      order.agent._id.toString() !==
      agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to update this device."
      );

      error.statusCode = 403;

      throw error;
    }

    // Device condition can be recorded
    // before the actual pickup.
    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Device condition cannot be updated because the order status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    if (!order.device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    const device =
      await Device.findById(
        order.device._id
      );

    if (!device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 404;

      throw error;
    }

    // Update only the fields provided by the agent.
    if (
      conditionData.screenCondition !==
      undefined
    ) {
      device.agentEvaluation.screenCondition =
        conditionData.screenCondition;
    }

    if (
      conditionData.displayIssues !==
      undefined
    ) {
      device.agentEvaluation.displayIssues =
        conditionData.displayIssues;
    }

    if (
      conditionData.bodyCondition !==
      undefined
    ) {
      device.agentEvaluation.bodyCondition =
        conditionData.bodyCondition;
    }

    if (
      conditionData.batteryHealth !==
      undefined
    ) {
      device.agentEvaluation.batteryHealth =
        conditionData.batteryHealth;
    }

    if (
      conditionData.repairHistory !==
      undefined
    ) {
      device.agentEvaluation.repairHistory =
        conditionData.repairHistory;
    }

    if (
      conditionData.accessories !==
      undefined
    ) {
      device.agentEvaluation.accessories =
        conditionData.accessories;
    }

    if (
      conditionData.functionalIssues !==
      undefined
    ) {
      device.agentEvaluation.functionalIssues =
        conditionData.functionalIssues;
    }

    device.agentEvaluation.verifiedBy =
      agentId;

    device.agentEvaluation.verifiedAt =
      new Date();

    device.updatedBy =
      agentId;

    await device.save();

    return orderRepository.findById(
      orderId
    );
  }

  // UPLOAD AGENT DEVICE PHOTOS

  async uploadAgentDevicePhotos(
    orderId,
    agentId,
    files
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

    // Only the assigned agent can upload
    // photos for this device.
    if (
      !order.agent ||
      order.agent._id.toString() !==
      agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to upload photos for this order."
      );

      error.statusCode = 403;

      throw error;
    }

    // Photos can be uploaded while the
    // agent is handling the pickup.
    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Device photos cannot be uploaded because the order status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      !order.device ||
      !order.device._id
    ) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      !files ||
      !files.length
    ) {
      const error = new Error(
        "At least one device photo is required."
      );

      error.statusCode = 400;

      throw error;
    }

    // Allow a maximum of 8 device photos
    // in one upload request.
    if (files.length > 8) {
      const error = new Error(
        "You can upload a maximum of 8 device photos at a time."
      );

      error.statusCode = 400;

      throw error;
    }

    // Device photos must be images only.
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    for (const file of files) {
      if (
        !allowedImageTypes.includes(
          file.mimetype
        )
      ) {
        const error = new Error(
          "Only JPG, JPEG and PNG images are allowed for device photos."
        );

        error.statusCode = 400;

        throw error;
      }
    }

    const device =
      await Device.findById(
        order.device._id
      );

    if (!device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 404;

      throw error;
    }

    const uploadedPhotos = [];

    for (const file of files) {
      const uploadedFile =
        await uploadBufferToCloudinary(
          file.buffer,
          {
            folder:
              `excart/orders/${orderId}/device-photos`,

            resource_type:
              "image",
          }
        );

      uploadedPhotos.push({
        url:
          uploadedFile.secure_url ||
          uploadedFile.url ||
          "",

        publicId:
          uploadedFile.public_id ||
          "",

        uploadedAt:
          new Date(),
      });
    }

    device.photos.push(
      ...uploadedPhotos
    );

    device.updatedBy =
      agentId;

    await device.save();

    return orderRepository.findById(
      orderId
    );
  }

  // UPLOAD PICKUP DOCUMENTS

  async uploadPickupDocuments(
    orderId,
    agentId,
    files
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

    // Only the assigned agent can upload
    if (
      !order.agent ||
      order.agent._id.toString() !==
      agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to upload pickup documents for this order."
      );

      error.statusCode = 403;

      throw error;
    }

    // Documents can be uploaded during pickup handling
    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Pickup documents cannot be uploaded because the order status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const customerPhoto =
      files?.customerPhoto?.[0];

    const aadhaarDocument =
      files?.aadhaarDocument?.[0];

    if (!customerPhoto) {
      const error = new Error(
        "Customer live photo is required."
      );

      error.statusCode = 400;

      throw error;
    }

    if (!aadhaarDocument) {
      const error = new Error(
        "Aadhaar document photo is required."
      );

      error.statusCode = 400;

      throw error;
    }

    // Pickup documents must be images only
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (
      !allowedImageTypes.includes(
        customerPhoto.mimetype
      ) ||
      !allowedImageTypes.includes(
        aadhaarDocument.mimetype
      )
    ) {
      const error = new Error(
        "Only JPG, JPEG and PNG images are allowed."
      );

      error.statusCode = 400;

      throw error;
    }

    const customerPhotoUpload =
      await uploadBufferToCloudinary(
        customerPhoto.buffer,
        {
          folder:
            `excart/orders/${orderId}/pickup-documents/customer`,
          resource_type: "image",
        }
      );

    const aadhaarDocumentUpload =
      await uploadBufferToCloudinary(
        aadhaarDocument.buffer,
        {
          folder:
            `excart/orders/${orderId}/pickup-documents/aadhaar`,
          resource_type: "image",
        }
      );

    order.pickup.verification.customerPhoto = {
      url:
        customerPhotoUpload.secure_url ||
        customerPhotoUpload.url ||
        "",

      publicId:
        customerPhotoUpload.public_id ||
        "",

      fileName:
        customerPhoto.originalname ||
        "",

      uploadedBy:
        agentId,

      uploadedAt:
        new Date(),
    };

    order.pickup.verification.aadhaar.document = {
      url:
        aadhaarDocumentUpload.secure_url ||
        aadhaarDocumentUpload.url ||
        "",

      publicId:
        aadhaarDocumentUpload.public_id ||
        "",

      fileName:
        aadhaarDocument.originalname ||
        "",

      uploadedBy:
        agentId,

      uploadedAt:
        new Date(),
    };

    await order.save();

    return orderRepository.findById(
      orderId
    );
  }

  // CALCULATE AGENT DEVICE VALUATION

  async calculateAgentDeviceValuation(
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

    // Only the assigned agent can calculate
    // the device valuation.
    if (
      !order.agent ||
      order.agent._id.toString() !==
      agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to calculate the device valuation."
      );

      error.statusCode = 403;

      throw error;
    }

    // Agent valuation is allowed during
    // the physical pickup process.
    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Device valuation cannot be calculated because the order status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    if (!order.device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    const device =
      await Device.findById(
        order.device._id
      );

    if (!device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 404;

      throw error;
    }

    // Use the agent's physical evaluation
    // for the second pricing calculation.
    const evaluation =
      device.agentEvaluation?.toObject
        ? device.agentEvaluation.toObject()
        : device.agentEvaluation || {};

    const pricingResult =
      await calculatePrice({
        deviceCatalogId:
          order.deviceCatalogId ||
          order.device.deviceCatalogId,

        evaluation,
      });

    device.agentValuation = {
      amount:
        pricingResult.finalPrice,

      totalAdjustment:
        pricingResult.totalAdjustment,

      appliedRules:
        pricingResult.appliedRules.map(
          (rule) => ({
            ruleId:
              rule.ruleId || "",

            name:
              rule.name || rule.conditionType || "",

            adjustmentType:
              rule.adjustmentType,

            amount:
              Math.abs(
                Number(
                  rule.adjustmentValue || 0
                )
              ),
          })
        ),

      calculatedAt:
        new Date(),

      calculatedBy:
        agentId,
    };

    device.updatedBy =
      agentId;

    await device.save();

    return orderRepository.findById(
      orderId
    );
  }

  // AGENT - CUSTOMER AADHAAR SEND OTP

  async sendCustomerAadhaarOtp(
    orderId,
    agentId,
    aadhaarNumber
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
      !order.agent ||
      order.agent._id.toString() !==
      agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to verify Aadhaar for this order."
      );

      error.statusCode = 403;

      throw error;
    }

    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Customer Aadhaar verification cannot be started when order status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const normalizedAadhaar =
      aadhaarNumber.trim();

    if (
      !/^\d{12}$/.test(
        normalizedAadhaar
      )
    ) {
      const error = new Error(
        "Invalid Aadhaar number."
      );

      error.statusCode = 400;

      throw error;
    }

    const result =
      await verificationService.sendAadhaarOtp(
        normalizedAadhaar
      );

    const referenceId =
      result?.data?.reference_id;

    if (!referenceId) {
      const error = new Error(
        "PowerAPI did not return an Aadhaar verification reference ID."
      );

      error.statusCode = 502;

      throw error;
    }

    await orderRepository.updateById(
      orderId,
      {
        "pickup.verification.status":
          "pending",

        "pickup.verification.aadhaar.verification.status":
          "pending",

        "pickup.verification.aadhaar.verification.referenceId":
          referenceId,

        "pickup.verification.aadhaar.verification.aadhaarLast4":
          normalizedAadhaar.slice(-4),

        updatedBy:
          agentId,
      }
    );

    await auditLogger({
      actor: agentId,
      action: "AADHAAR_OTP_SENT",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Aadhaar OTP was sent for customer verification on order ${order.orderNumber}.`,
      newValue: {
        aadhaarLast4:
          normalizedAadhaar.slice(-4),
        verificationStatus:
          "pending",
        referenceId,
      },
    });

    return {
      referenceId,

      aadhaarLast4:
        normalizedAadhaar.slice(-4),

      message:
        "Aadhaar OTP sent successfully.",
    };
  }



  // AGENT - CUSTOMER AADHAAR VERIFY OTP


  async verifyCustomerAadhaarOtp(
    orderId,
    agentId,
    otp
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
      !order.agent ||
      order.agent._id.toString() !==
      agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to verify Aadhaar for this order."
      );

      error.statusCode = 403;

      throw error;
    }

    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Customer Aadhaar verification cannot be completed when order status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const referenceId =
      order.pickup?.verification
        ?.aadhaar?.verification
        ?.referenceId;

    if (!referenceId) {
      const error = new Error(
        "Please send the Aadhaar OTP first."
      );

      error.statusCode = 400;

      throw error;
    }

    const normalizedOtp =
      otp.trim();

    if (
      !/^\d{6}$/.test(
        normalizedOtp
      )
    ) {
      const error = new Error(
        "Invalid OTP."
      );

      error.statusCode = 400;

      throw error;
    }

    const result =
      await verificationService.verifyAadhaarOtp(
        normalizedOtp,
        referenceId
      );

    if (!result?.success) {
      const error = new Error(
        "Customer Aadhaar verification failed."
      );

      error.statusCode = 400;

      throw error;
    }

    const aadhaarData =
      result?.data || {};

    const verifiedAadhaar =
      aadhaarData.aadhaar_number ||
      "";

    const aadhaarLast4 =
      verifiedAadhaar.length >= 4
        ? verifiedAadhaar.slice(-4)
        : order.pickup?.verification
          ?.aadhaar?.verification
          ?.aadhaarLast4 || "";

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          "pickup.verification.status":
            "pending",

          "pickup.verification.aadhaar.verification.status":
            "verified",

          "pickup.verification.aadhaar.verification.referenceId":
            referenceId,

          "pickup.verification.aadhaar.verification.aadhaarLast4":
            aadhaarLast4,

          "pickup.verification.aadhaar.verification.name":
            aadhaarData.name || "",

          "pickup.verification.aadhaar.verification.dateOfBirth":
            aadhaarData.date_of_birth || "",

          "pickup.verification.aadhaar.verification.gender":
            aadhaarData.gender || "",

          "pickup.verification.aadhaar.verification.address":
            aadhaarData.address || "",

          "pickup.verification.aadhaar.verification.verifiedAt":
            new Date(),

          "pickup.verification.aadhaar.verification.verifiedBy":
            agentId,

          updatedBy:
            agentId,
        }
      );

    await auditLogger({
      actor: agentId,
      action: "AADHAAR_VERIFIED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Customer Aadhaar was successfully verified for order ${order.orderNumber}.`,
      newValue: {
        aadhaarLast4,
        verificationStatus:
          "verified",
        verifiedBy:
          agentId,
      },
    });

    return updatedOrder;
  }


  // AGENT PICKUP VERIFICATION


  async verifyPickup(
    orderId,
    agentId,
    data
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
      !order.agent ||
      order.agent._id.toString() !==
      agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to verify this pickup."
      );

      error.statusCode = 403;

      throw error;
    }

    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Pickup verification cannot be completed when order status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const {
      customerPhotoUrl,
      customerPhotoPublicId,
      aadhaarUrl,
      aadhaarPublicId,
    } = data;

    if (!customerPhotoUrl) {
      const error = new Error(
        "Customer photo is required."
      );

      error.statusCode = 400;

      throw error;
    }

    if (!aadhaarUrl) {
      const error = new Error(
        "Aadhaar document is required."
      );

      error.statusCode = 400;

      throw error;
    }

    const aadhaarVerification =
      order.pickup?.verification
        ?.aadhaar?.verification;

    if (
      aadhaarVerification?.status !==
      "verified"
    ) {
      const error = new Error(
        "Customer Aadhaar must be verified before pickup."
      );

      error.statusCode = 400;

      throw error;
    }

    const verifiedAt =
      new Date();

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          "pickup.verification.customerPhoto":
          {
            url:
              customerPhotoUrl,

            publicId:
              customerPhotoPublicId ||
              "",

            uploadedBy:
              agentId,

            uploadedAt:
              verifiedAt,
          },

          "pickup.verification.aadhaar.document":
          {
            url:
              aadhaarUrl,

            publicId:
              aadhaarPublicId ||
              "",

            uploadedBy:
              agentId,

            uploadedAt:
              verifiedAt,
          },

          "pickup.verification.status":
            "verified",

          "pickup.verification.verifiedBy":
            agentId,

          "pickup.verification.verifiedAt":
            verifiedAt,

          updatedBy:
            agentId,

          $push: {
            timeline: {
              status:
                "pickup_verification_completed",

              message:
                "Customer photo, Aadhaar document, and Aadhaar verification completed.",

              performedBy:
                agentId,
            },
          },
        }
      );

    await auditLogger({
      actor: agentId,
      action: "PICKUP_VERIFICATION_COMPLETED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Pickup verification for order ${order.orderNumber} was completed by the assigned agent.`,
      oldValue: {
        verificationStatus:
          order.pickup?.verification?.status ||
          "pending",
      },
      newValue: {
        verificationStatus:
          "verified",
        verifiedBy:
          agentId,
        verifiedAt,
      },
      metadata: {
        customerPhotoUploaded:
          true,
        aadhaarDocumentUploaded:
          true,
        aadhaarVerificationStatus:
          "verified",
      },
    });

    return updatedOrder;
  }

  // AGENT PICKUP


  async pickupOrder(
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

    if (
      ![
        "assigned",
        "pickup_scheduled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Order cannot be picked up because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const verification =
      order.pickup?.verification;

    if (
      !verification?.customerPhoto?.url
    ) {
      const error = new Error(
        "Customer photo is required before pickup."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      !verification?.aadhaar?.document?.url
    ) {
      const error = new Error(
        "Aadhaar document is required before pickup."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      verification?.aadhaar?.verification
        ?.status !==
      "verified"
    ) {
      const error = new Error(
        "Aadhaar must be verified before pickup."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      verification?.status !==
      "verified"
    ) {
      const error = new Error(
        "Pickup verification must be completed before pickup."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      order.pickup?.status ===
      "completed"
    ) {
      const error = new Error(
        "Order has already been picked up."
      );

      error.statusCode = 400;

      throw error;
    }

    const pickedUpAt =
      new Date();

    if (order.device) {
      const device =
        await Device.findById(
          order.device._id
        );

      if (!device) {
        const error = new Error(
          "Associated device not found."
        );

        error.statusCode = 404;

        throw error;
      }

      device.pickupAgent =
        agentId;

      device.status =
        "picked_up";

      device.updatedBy =
        agentId;

      await device.save();
    }

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          status:
            "payment_pending",

          "pickup.status":
            "completed",

          "pickup.assignedAgent":
            agentId,

          "pickup.pickedUpAt":
            pickedUpAt,

          "pickup.verification.verifiedBy":
            agentId,

          "pickup.verification.verifiedAt":
            pickedUpAt,

          "payment.status":
            "pending",

          updatedBy:
            agentId,

          $push: {
            timeline: {
              status:
                "payment_pending",

              message:
                "Device picked up successfully. Payment to customer is pending.",

              performedBy:
                agentId,
            },
          },
        }
      );

  
    try {
      await notificationService.createNotification({
        recipient:
          order.customer._id ||
          order.customer,

        title:
          "Device Picked Up",

        message:
          `Your device for order ${order.orderNumber} has been picked up successfully.`,

        type:
          "pickup_completed",

        order:
          order._id,
      });
    } catch (error) {
      console.error(
        "Failed to create pickup notification:",
        error
      );
    }

    await auditLogger({
      actor: agentId,
      action: "ORDER_PICKED_UP",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Device for order ${order.orderNumber} was picked up by the assigned agent.`,
      oldValue: {
        orderStatus:
          order.status,
        pickupStatus:
          order.pickup?.status ||
          "pending",
        paymentStatus:
          order.payment?.status ||
          "pending",
      },
      newValue: {
        orderStatus:
          "payment_pending",
        pickupStatus:
          "completed",
        paymentStatus:
          "pending",
        pickedUpAt,
      },
      metadata: {
        agentId:
          agentId.toString(),
        deviceId:
          order.device?._id ||
          order.device ||
          null,
      },
    });

    return updatedOrder;
  }


  // ADMIN RECEIVE DEVICE


  async receiveOrder(
    orderId,
    adminId
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
      order.status !==
      "in_transit"
    ) {
      const error = new Error(
        `Order cannot be received because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    if (!order.device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    const device =
      await Device.findById(
        order.device._id
      );

    if (!device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 404;

      throw error;
    }

    device.status =
      "received_in_shop";

    device.updatedBy =
      adminId;

    await device.save();

    // Create agent earning when the device is received at the store
if (order.agent && Number(order.agentCommission || 0) > 0) {
  try {
    await AgentEarning.create({
      agent: order.agent,
      order: order._id,
      amount: Number(order.agentCommission || 0),
      status: "pending",
    });
  } catch (error) {
    if (error?.code === 11000) {
      console.warn(
        `Agent earning already exists for order ${order.orderNumber}.`
      );
    } else {
      throw error;
    }
  }
}

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          status:
            "inspection_pending",

          "inspection.status":
            "pending",

          updatedBy:
            adminId,

          $push: {
            timeline: {
              status:
                "inspection_pending",

              message:
                "Device received at store. Inspection is pending.",

              performedBy:
                adminId,
            },
          },
        }
      );

    await auditLogger({
      actor: adminId,
      action: "DEVICE_RECEIVED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Device for order ${order.orderNumber} was received at the store by the admin.`,
      oldValue: {
        orderStatus:
          order.status,
        deviceStatus:
          "in_transit",
        inspectionStatus:
          order.inspection?.status ||
          "pending",
      },
      newValue: {
        orderStatus:
          "inspection_pending",
        deviceStatus:
          "received_in_shop",
        inspectionStatus:
          "pending",
      },
      metadata: {
        adminId:
          adminId.toString(),
        deviceId:
          device._id.toString(),
      },
    });

    return updatedOrder;

  }



  // GET PURCHASE INVOICE


  async getPurchaseInvoice(
    orderId
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

    const invoice =
      order.documents?.find(
        (document) =>
          document.type ===
          "purchase_invoice"
      );

    if (!invoice) {
      const error = new Error(
        "Purchase invoice not found for this order."
      );

      error.statusCode = 404;

      throw error;
    }

    return invoice;
  }



  // GET PAYMENT SLIP


  async getPaymentSlip(
    orderId
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

    const paymentSlip =
      order.documents?.find(
        (document) =>
          document.type ===
          "payment_slip"
      );

    if (!paymentSlip) {
      const error = new Error(
        "Payment slip not found for this order."
      );

      error.statusCode = 404;

      throw error;
    }

    return paymentSlip;
  }



  // DELETE ORDER


  async deleteOrder(
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
      [
        "completed",
        "payment_completed",
      ].includes(order.status)
    ) {
      const error = new Error(
        "This order cannot be deleted."
      );

      error.statusCode = 400;

      throw error;
    }

    const deletedOrder =
      await orderRepository.deleteById(
        orderId
      );

    await auditLogger({
      actor: userId,
      action: "ORDER_DELETED",
      module: "order",
      entityType: "Order",
      entityId: order._id,
      description:
        `Order ${order.orderNumber} was deleted.`,
      oldValue: {
        status:
          order.status,
        orderNumber:
          order.orderNumber,
      },
    });

    return deletedOrder;
  }


  // GENERATE ORDER NUMBER


  async generateOrderNumber() {
    return `ORD-${Date.now()}`;
  }
}


export default new OrderService();