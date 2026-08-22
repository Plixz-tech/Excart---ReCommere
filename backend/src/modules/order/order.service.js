import orderRepository from "./order.repository.js";
import Device from "../../models/Device.js";

import { uploadBufferToCloudinary } from "../../lib/uploadBuffer.js";
import { generatePurchaseInvoicePdf } from "../../lib/purchaseInvoicePdf.js";
import { generatePaymentSlipPdf } from "../../lib/paymentSlipPdf.js";

class OrderService {
 
  // CREATE ORDER
 

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

    // 1. Check duplicate IMEI

    const existingDevice =
      await Device.findOne({
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

    // 3. Create Order

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
      await orderRepository.create(
        orderData
      );

    // 4. Return complete order

    return orderRepository.findById(
      order._id
    );
  }

 
  // CUSTOMER DEVICE INVOICE UPLOAD
 

  async uploadDeviceInvoice(
    orderId,
    file,
    userId
  ) {
    // 1. Find order

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

    // 2. Make sure customer owns order

    if (
      order.customer._id.toString() !==
      userId.toString()
    ) {
      const error = new Error(
        "You are not authorized to upload invoice for this order."
      );

      error.statusCode = 403;

      throw error;
    }

    // 3. Check file

    if (!file) {
      const error = new Error(
        "Device invoice file is required."
      );

      error.statusCode = 400;

      throw error;
    }

    // 4. Upload customer invoice

    const uploadedFile =
      await uploadBufferToCloudinary(
        file.buffer,
        {
          folder:
            `excart/orders/${orderId}/device-invoice`,

          resource_type: "auto",
        }
      );

    // 5. Create document

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
        file.originalname ||
        "",

      uploadedBy: userId,

      uploadedAt: new Date(),
    };

    // 6. Save document

    const updatedOrder =
      await orderRepository.updateById(
        orderId,
        {
          $push: {
            documents:
              invoiceDocument,
          },

          updatedBy: userId,
        }
      );

    return updatedOrder;
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
      ![
        "pending",
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
      }
    );
  }

 
  // ADMIN ORDERS
 

  async getOrderById(
    orderId
  ) {
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

  async getOrders(
    query
  ) {
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

    device.pickupAgent =
      agentId;

    device.updatedBy =
      adminId;

    await device.save();

    // Update Order

    const updateData = {
      agent: agentId,

      status: "assigned",

      "pickup.status":
        "assigned",

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

    return order;
  }

 
  // DELETE ORDER
 

  async deleteOrder(
    orderId
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

    // Make sure order belongs to agent

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

    // Order must be assigned

    if (
      order.status !==
      "assigned"
    ) {
      const error = new Error(
        `Order cannot be picked up because its current status is "${order.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    // Check pickup status

    if (
      order.pickup &&
      order.pickup.status ===
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

    // Update device

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

    // Update order

    const updateData = {
      status: "picked_up",

      "pickup.status":
        "completed",

      "pickup.assignedAgent":
        agentId,

      "pickup.pickedUpAt":
        pickedUpAt,

      updatedBy: agentId,
    };

    return orderRepository.updateById(
      orderId,
      updateData
    );
  }

 
  // ADMIN PROCESS PAYMENT
  //
  // Payment completed
  //       ↓
  // Purchase Invoice generated
  //       ↓
  // Payment Slip generated
  //       ↓
  // Both saved to Order.documents
 

  async processPayment(
    orderId,
    paymentData,
    adminId
  ) {
    // 1. Find order

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

    // 2. Payment only after pickup

    if (
      order.status !==
      "picked_up"
    ) {
      const error = new Error(
        "Payment can only be processed after the device has been picked up."
      );

      error.statusCode = 400;

      throw error;
    }

    // 3. Check if already paid

    if (
      order.payment?.status ===
      "completed"
    ) {
      const error = new Error(
        "Payment has already been completed."
      );

      error.statusCode = 400;

      throw error;
    }

    // 4. Validate final amount

    const finalAmount =
      Number(
        paymentData.finalAmount
      );

    if (
      !Number.isFinite(
        finalAmount
      ) ||
      finalAmount <= 0
    ) {
      const error = new Error(
        "Valid final amount is required."
      );

      error.statusCode = 400;

      throw error;
    }

    // 5. Save payment details

    const paymentUpdate = {
      "payment.status":
        "completed",

      "payment.finalAmount":
        finalAmount,

      "payment.paymentMethod":
        paymentData.paymentMethod,

      "payment.transactionId":
        paymentData.transactionId ||
        "",

      "payment.paidAt":
        new Date(),

      "payment.notes":
        paymentData.notes ||
        "",

      updatedBy: adminId,
    };

    await orderRepository.updateById(
      orderId,
      paymentUpdate
    );

    // 6. Get updated order
    // This is important because the PDFs
    // need the completed payment details.

    const paidOrder =
      await orderRepository.findById(
        orderId
      );

    // 7. GENERATE PURCHASE INVOICE

    const purchaseInvoiceBuffer =
      await generatePurchaseInvoicePdf(
        paidOrder
      );

const purchaseInvoiceFile =
  await uploadBufferToCloudinary(
    purchaseInvoiceBuffer,
    {
      folder:
        `excart/orders/${orderId}/purchase-invoice`,

      resource_type: "raw",

      public_id:
        `Purchase-Invoice-${paidOrder.orderNumber}`,

      format: "pdf",
    }
  );

    const purchaseInvoiceDocument = {
      type: "purchase_invoice",

      url:
        purchaseInvoiceFile.secure_url ||
        purchaseInvoiceFile.url ||
        "",

      publicId:
        purchaseInvoiceFile.public_id ||
        "",

      fileName:
        `Purchase-Invoice-${paidOrder.orderNumber}.pdf`,

      uploadedBy: adminId,

      uploadedAt: new Date(),
    };

    // 8. GENERATE PAYMENT SLIP

    const paymentSlipBuffer =
      await generatePaymentSlipPdf(
        paidOrder
      );

const paymentSlipFile =
  await uploadBufferToCloudinary(
    paymentSlipBuffer,
    {
      folder:
        `excart/orders/${orderId}/payment-slip`,

      resource_type: "raw",

      public_id:
        `Payment-Slip-${paidOrder.orderNumber}`,

      format: "pdf",
    }
  );

    const paymentSlipDocument = {
      type: "payment_slip",

      url:
        paymentSlipFile.secure_url ||
        paymentSlipFile.url ||
        "",

      publicId:
        paymentSlipFile.public_id ||
        "",

      fileName:
        `Payment-Slip-${paidOrder.orderNumber}.pdf`,

      uploadedBy: adminId,

      uploadedAt: new Date(),
    };

    // 9. SAVE BOTH DOCUMENTS

    const finalOrder =
      await orderRepository.updateById(
        orderId,
        {
          $push: {
            documents: {
              $each: [
                purchaseInvoiceDocument,
                paymentSlipDocument,
              ],
            },
          },

          // Device has not reached store yet.
          // Agent still needs to start transit.

          status: "picked_up",

          updatedBy: adminId,
        }
      );

    return finalOrder;
  }

 
  // GENERATE ORDER NUMBER
 

  async generateOrderNumber() {
    const timestamp =
      Date.now();

    return `ORD-${timestamp}`;
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

    // Make sure order belongs to agent

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

    // Order must be picked up

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

    // Device must exist

    if (!order.device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    // Update device

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

    // Update order

    const updateData = {
      status: "in_transit",

      updatedBy: agentId,

      $push: {
        timeline: {
          status:
            "in_transit",

          message:
            "Device is in transit to the store.",

          performedBy:
            agentId,
        },
      },
    };

    return orderRepository.updateById(
      orderId,
      updateData
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

    // Order must be in transit

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

    // Device must exist

    if (!order.device) {
      const error = new Error(
        "Associated device not found."
      );

      error.statusCode = 400;

      throw error;
    }

    // Find device

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

    // Update device

    device.status =
      "received_in_shop";

    device.updatedBy =
      adminId;

    await device.save();

    // Update order

    const updateData = {
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
    };

    return orderRepository.updateById(
      orderId,
      updateData
    );
  }

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
}

export default new OrderService();