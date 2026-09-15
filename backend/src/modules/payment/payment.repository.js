import mongoose from "mongoose";

import Order from "../../models/Order.js";
import Device from "../../models/Device.js";
import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";

const getPaymentOrderStatuses = [
  "payment_pending",
  "payment_completed",
];

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

  if (status) {
    filter["payment.status"] =
      status;
  }

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
        "fullName phone email"
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

export const updatePayment = async (
  orderId,
  paymentData
) => {
  const order =
    await findOrderForPayment(
      orderId
    );

  if (
    !getPaymentOrderStatuses.includes(
      order.status
    )
  ) {
    throw new ApiError(
      400,
      `Payment cannot be updated when order status is "${order.status}".`
    );
  }

  if (
    !order.payment
  ) {
    throw new ApiError(
      400,
      "Payment information is not available for this order."
    );
  }

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
    paymentData.paidAt !==
    undefined
  ) {
    order.payment.paidAt =
      paymentData.paidAt;
  }

  order.updatedBy =
    paymentData.updatedBy;

  await order.save();

  return order;
};

export const completePayment = async (
  orderId,
  paymentData
) => {
  const order =
    await findOrderForPayment(
      orderId
    );

  if (
    !order.payment
  ) {
    throw new ApiError(
      400,
      "Payment information is not available for this order."
    );
  }

  if (
    order.status !==
    "payment_pending"
  ) {
    throw new ApiError(
      400,
      `Payment cannot be completed when order status is "${order.status}".`
    );
  }

  if (
    ![
      "pending",
      "failed",
    ].includes(
      order.payment.status
    )
  ) {
    throw new ApiError(
      400,
      `Payment cannot be completed when payment status is "${order.payment.status}".`
    );
  }

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

  order.status =
    "in_transit";

  order.updatedBy =
    paymentData.completedBy;

  order.timeline.push({
    status:
      "in_transit",

    message:
      "Payment completed successfully. Device is now in transit.",

    performedBy:
      paymentData.completedBy,
  });

  if (!order.device) {
    throw new ApiError(
      400,
      "Associated device not found."
    );
  }

  const device =
    await Device.findById(
      order.device
    );

  if (!device) {
    throw new ApiError(
      404,
      "Associated device not found."
    );
  }

  device.status =
    "in_transit";

  device.updatedBy =
    paymentData.completedBy;

  await device.save();

  await order.save();

  return order;
};

export const failPayment = async (
  orderId,
  paymentData
) => {
  const order =
    await findOrderForPayment(
      orderId
    );

  if (
    order.status !==
    "payment_pending"
  ) {
    throw new ApiError(
      400,
      `Payment cannot be failed when order status is "${order.status}".`
    );
  }

  if (
    !order.payment
  ) {
    throw new ApiError(
      400,
      "Payment information is not available for this order."
    );
  }

  if (
    ![
      "pending",
      "processing",
    ].includes(
      order.payment.status
    )
  ) {
    throw new ApiError(
      400,
      `Payment cannot be failed when payment status is "${order.payment.status}".`
    );
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

  order.payment.status =
    "failed";

  order.updatedBy =
    paymentData.updatedBy;

  order.status =
    "payment_pending";

  order.timeline.push({
    status:
      "payment_pending",

    message:
      paymentData.notes ||
      "Payment failed. Payment needs to be processed again.",

    performedBy:
      paymentData.updatedBy,
  });

  await order.save();

  return order;
};