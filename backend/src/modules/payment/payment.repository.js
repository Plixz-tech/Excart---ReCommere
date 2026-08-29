import mongoose from "mongoose";

import Order from "../../models/Order.js";
import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";

// GET PAYMENT BY ORDER ID

export const getPaymentByOrderId = async (
  orderId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      orderId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid order ID."
    );
  }

  const order =
    await Order.findById(orderId)
      .populate(
        "customer",
        "fullName email phone"
      )
      .populate("device")
      .populate(
        "agent",
        "fullName email phone"
      );

  if (!order) {
    throw new ApiError(
      404,
      "Order not found."
    );
  }

  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer,
    device: order.device,
    agent: order.agent,
    orderStatus: order.status,
    payment: order.payment,
  };
};

// GET ALL PAYMENTS

export const getPayments = async (
  queryParams
) => {
  const {
    page,
    limit,
    skip,
  } = getPagination(queryParams);

  const {
    status,
    order: orderParam = "desc",
    sortBy = "updatedAt",
  } = queryParams;

  const filter = {};

  // Filter by payment status

  if (status) {
    filter["payment.status"] =
      status;
  }

  // Allowed sorting fields

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "payment.finalAmount",
    "payment.estimatedAmount",
    "payment.paidAt",
  ];

  const sortField =
    allowedSortFields.includes(
      sortBy
    )
      ? sortBy
      : "updatedAt";

  const sort = {
    [sortField]:
      orderParam === "asc"
        ? 1
        : -1,
  };

  const orders =
    await Order.find(filter)
      .populate(
        "customer",
        "fullName email phone"
      )
      .populate("device")
      .populate(
        "agent",
        "fullName email phone"
      )
      .sort(sort)
      .skip(skip)
      .limit(limit);

  const totalPayments =
    await Order.countDocuments(
      filter
    );

  return {
    payments: orders.map(
      (order) => ({
        orderId: order._id,
        orderNumber:
          order.orderNumber,
        customer:
          order.customer,
        device:
          order.device,
        agent:
          order.agent,
        orderStatus:
          order.status,
        payment:
          order.payment,
      })
    ),

    pagination: {
      currentPage: page,

      totalPages:
        Math.ceil(
          totalPayments /
            limit
        ),

      totalPayments,

      limit,
    },
  };
};

// FIND ORDER FOR PAYMENT

export const findOrderForPayment = async (
  orderId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      orderId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid order ID."
    );
  }

  const order =
    await Order.findById(
      orderId
    );

  if (!order) {
    throw new ApiError(
      404,
      "Order not found."
    );
  }

  return order;
};

// UPDATE PAYMENT

export const updatePayment = async (
  order,
  paymentData,
  userId
) => {
  if (
    paymentData.paymentMethod !==
    undefined
  ) {
    order.payment.paymentMethod =
      paymentData.paymentMethod;
  }

  if (
    paymentData.transactionId !==
    undefined
  ) {
    order.payment.transactionId =
      paymentData.transactionId;
  }

  if (
    paymentData.notes !==
    undefined
  ) {
    order.payment.notes =
      paymentData.notes;
  }

  if (
    paymentData.finalAmount !==
    undefined
  ) {
    order.payment.finalAmount =
      paymentData.finalAmount;
  }

  if (
    paymentData.estimatedAmount !==
    undefined
  ) {
    order.payment.estimatedAmount =
      paymentData.estimatedAmount;
  }

  if (
    paymentData.status !==
    undefined
  ) {
    order.payment.status =
      paymentData.status;
  }

  if (
    paymentData.paidAt !==
    undefined
  ) {
    order.payment.paidAt =
      paymentData.paidAt;
  }

  order.updatedBy =
    userId;

  await order.save();

  return order;
};

// COMPLETE PAYMENT

export const completePayment = async (
  order,
  paymentData,
  userId
) => {
  if (
    paymentData.paymentMethod !==
    undefined
  ) {
    order.payment.paymentMethod =
      paymentData.paymentMethod;
  }

  if (
    paymentData.transactionId !==
    undefined
  ) {
    order.payment.transactionId =
      paymentData.transactionId;
  }

  if (
    paymentData.notes !==
    undefined
  ) {
    order.payment.notes =
      paymentData.notes;
  }

  if (
    paymentData.finalAmount !==
    undefined
  ) {
    order.payment.finalAmount =
      paymentData.finalAmount;
  }

  order.payment.status =
    "completed";

  order.payment.paidAt =
    new Date();

  // Payment is completed.
  // The device can now move into transit.

  order.status =
    "in_transit";

  order.updatedBy =
    userId;

  order.timeline.push({
    status:
      "in_transit",

    message:
      "Payment completed successfully. Device is now in transit.",

    performedBy:
      userId,
  });

  await order.save();

  return order;
};

// FAIL PAYMENT

export const failPayment = async (
  order,
  paymentData,
  userId
) => {
  order.payment.status =
    "failed";

  if (
    paymentData.transactionId !==
    undefined
  ) {
    order.payment.transactionId =
      paymentData.transactionId;
  }

  if (
    paymentData.notes !==
    undefined
  ) {
    order.payment.notes =
      paymentData.notes;
  }

  order.updatedBy =
    userId;

  // Keep the order waiting for payment.
  // It must not move to transit.

  order.status =
    "payment_pending";

  order.timeline.push({
    status:
      "payment_pending",

    message:
      paymentData.notes ||
      "Payment failed. Payment needs to be processed again.",

    performedBy:
      userId,
  });

  await order.save();

  return order;
};