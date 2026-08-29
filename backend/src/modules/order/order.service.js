import orderRepository from "./order.repository.js";
import Device from "../../models/Device.js";
import User from "../../models/User.js";
import {calculatePrice,} from "../pricingRule/pricingRule.service.js";

import { generateGoogleMapsUrl } from "../../lib/googleMaps.js";
import { uploadBufferToCloudinary } from "../../lib/uploadBuffer.js";
import { generatePurchaseInvoicePdf } from "../../lib/purchaseInvoicePdf.js";
import { generatePaymentSlipPdf } from "../../lib/paymentSlipPdf.js";

class OrderService {

  // CUSTOMER CREATE ORDER

  async createOrder(data, userId) {
    const orderNumber =
      await this.generateOrderNumber();

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

    const mapsUrl =
      generateGoogleMapsUrl(
        pickup?.address
      );

    const scheduled =
      pickup?.scheduledDate &&
      pickup?.scheduledTime;

    const orderData = {
      orderNumber,
      customer: userId,
      agent: null,
      device: device._id,

      status: scheduled
        ? "pickup_scheduled"
        : "pending",

      pickup: {
        ...(pickup || {}),

        status: scheduled
          ? "scheduled"
          : "pending",

        scheduledDate:
          pickup?.scheduledDate || null,

        scheduledTime:
          pickup?.scheduledTime || "",

        assignedAgent: null,

        mapsUrl,

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
      await orderRepository.create(
        orderData
      );

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
          resource_type: "auto",
        }
      );

    const invoiceDocument = {
      type: "device_invoice",

      url:
        uploadedFile.secure_url ||
        uploadedFile.url ||
        "",

      publicId:
        uploadedFile.public_id ||
        "",

      fileName:
        file.originalname || "",

      uploadedBy: userId,

      uploadedAt: new Date(),
    };

    return orderRepository.updateById(
      orderId,
      {
        $push: {
          documents:
            invoiceDocument,
        },

        updatedBy: userId,
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
        customer: userId,
      },
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

    return orderRepository.updateById(
      orderId,
      {
        status: "cancelled",

        cancellationReason:
          "Cancelled by customer",

        updatedBy: userId,

        $push: {
          timeline: {
            status: "cancelled",
            message:
              "Order cancelled by customer.",
            performedBy: userId,
          },
        },
      }
    );
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

  async getOrderById(orderId) {
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

    return orderRepository.updateById(
      orderId,
      {
        ...data,
        updatedBy: userId,
      }
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

    if (order.status === "completed") {
      const error = new Error(
        "Completed order status cannot be changed."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      order.status === "cancelled" &&
      status !== "cancelled"
    ) {
      const error = new Error(
        "Cancelled order status cannot be changed."
      );

      error.statusCode = 400;

      throw error;
    }

    return orderRepository.updateById(
      orderId,
      {
        status,

        updatedBy: userId,

        $push: {
          timeline: {
            status,

            message:
              `Order status changed to ${status}.`,

            performedBy: userId,
          },
        },
      }
    );
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
      [
        "completed",
        "cancelled",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Order cannot be assigned because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const agent =
      await User.findById(agentId);

    if (!agent) {
      const error = new Error(
        "Agent not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (agent.role !== "agent") {
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

    const scheduled =
      order.pickup?.scheduledDate &&
      order.pickup?.scheduledTime;

    return orderRepository.updateById(
      orderId,
      {
        agent: agentId,

        status: scheduled
          ? "pickup_scheduled"
          : "assigned",

        "pickup.status":
          scheduled
            ? "scheduled"
            : "assigned",

        "pickup.assignedAgent":
          agentId,

        updatedBy: adminId,

        $push: {
          timeline: {
            status: "assigned",

            message:
              "Order assigned to an agent.",

            performedBy: adminId,
          },
        },
      }
    );
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
        googleMapsUrl: mapsUrl,
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
      [
        "cancelled",
        "rejected",
        "picked_up",
        "in_transit",
        "inspection_pending",
        "inspection_in_progress",
        "inspection_completed",
        "ready_stock",
      ].includes(order.status)
    ) {
      const error = new Error(
        `Order cannot be self-assigned because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    const agent =
      await User.findById(agentId);

    if (!agent) {
      const error = new Error(
        "Agent not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (agent.role !== "agent") {
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

    const scheduled =
      order.pickup?.scheduledDate &&
      order.pickup?.scheduledTime;

    return orderRepository.updateById(
      orderId,
      {
        agent: agentId,

        "pickup.assignedAgent":
          agentId,

        "pickup.status":
          scheduled
            ? "scheduled"
            : "assigned",

        status:
          scheduled
            ? "pickup_scheduled"
            : "assigned",

        updatedBy: agentId,

        $push: {
          timeline: {
            status: "assigned",

            message:
              "Agent accepted the pickup request.",

            performedBy: agentId,
          },
        },
      }
    );
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
      aadhaarVerified,
    } = data;

    if (!aadhaarVerified) {
      const error = new Error(
        "Aadhaar must be verified before pickup."
      );

      error.statusCode = 400;

      throw error;
    }

    return orderRepository.updateById(
      orderId,
      {
        pickupVerification: {
          customerPhoto: {
            url: customerPhotoUrl,
            publicId:
              customerPhotoPublicId || "",
          },

          aadhaar: {
            url: aadhaarUrl,
            publicId:
              aadhaarPublicId || "",
            verified: true,
            verifiedBy: agentId,
            verifiedAt: new Date(),
          },

          verifiedBy: agentId,

          verifiedAt: new Date(),
        },

        updatedBy: agentId,

        $push: {
          timeline: {
            status:
              "pickup_verification_completed",

            message:
              "Customer and Aadhaar verification completed.",

            performedBy: agentId,
          },
        },
      }
    );
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
      order.pickupVerification;

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
      !verification?.aadhaar?.url
    ) {
      const error = new Error(
        "Aadhaar document is required before pickup."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      verification.aadhaar.verified !==
      true
    ) {
      const error = new Error(
        "Aadhaar must be verified before pickup."
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

    return orderRepository.updateById(
      orderId,
      {
        status: "picked_up",

        "pickup.status":
          "completed",

        "pickup.assignedAgent":
          agentId,

        "pickup.pickedUpAt":
          pickedUpAt,

        "pickupVerification.verifiedBy":
          agentId,

        "pickupVerification.verifiedAt":
          pickedUpAt,

        updatedBy: agentId,

        $push: {
          timeline: {
            status: "picked_up",

            message:
              "Device picked up after successful customer and Aadhaar verification.",

            performedBy: agentId,
          },
        },
      }
    );
  }

  // AGENT START TRANSIT

  async startTransit(
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
        "You are not authorized to start transit for this order."
      );

      error.statusCode = 403;

      throw error;
    }

    if (
      order.status !==
      "picked_up"
    ) {
      const error = new Error(
        `Order cannot be moved to transit because its current status is "${order.status}".`
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
      "in_transit";

    device.updatedBy =
      agentId;

    await device.save();

    return orderRepository.updateById(
      orderId,
      {
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
      }
    );
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

    return orderRepository.updateById(
      orderId,
      {
        status:
          "inspection_pending",

        "inspection.status":
          "pending",

        updatedBy: adminId,

        $push: {
          timeline: {
            status:
              "inspection_pending",

            message:
              "Device received at store. Inspection is pending.",

            performedBy: adminId,
          },
        },
      }
    );
  }

  // GET PURCHASE INVOICE

  async getPurchaseInvoice(orderId) {
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

  async getPaymentSlip(orderId) {
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

  async deleteOrder(orderId) {
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

    return orderRepository.deleteById(
      orderId
    );
  }

  // GENERATE ORDER NUMBER

  async generateOrderNumber() {
    return `ORD-${Date.now()}`;
  }
}

export default new OrderService();