import * as paymentRepository from "./payment.repository.js";

export const getPaymentByOrderId = async (
  orderId
) => {
  return paymentRepository.getPaymentByOrderId(
    orderId
  );
};

export const getPayments = async (
  query
) => {
  return paymentRepository.getPayments(
    query
  );
};

export const updatePayment = async (
  orderId,
  data,
  userId
) => {
  const order =
    await paymentRepository.findOrderForPayment(
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
      "payment_pending" &&
    order.status !==
      "payment_completed"
  ) {
    const error = new Error(
      `Payment cannot be updated when order status is "${order.status}".`
    );

    error.statusCode = 400;

    throw error;
  }

  return paymentRepository.updatePayment(
    orderId,
    {
      ...data,
      updatedBy:
        userId,
    }
  );
};

export const completePayment = async (
  orderId,
  data,
  userId
) => {
  const order =
    await paymentRepository.findOrderForPayment(
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
    "payment_pending"
  ) {
    const error = new Error(
      `Payment cannot be completed when order status is "${order.status}".`
    );

    error.statusCode = 400;

    throw error;
  }

  if (
    !order.payment ||
    order.payment.status !==
      "pending"
  ) {
    const error = new Error(
      "Payment is not pending for this order."
    );

    error.statusCode = 400;

    throw error;
  }

  return paymentRepository.completePayment(
    orderId,
    {
      ...data,
      completedBy:
        userId,
    }
  );
};

export const failPayment = async (
  orderId,
  data,
  userId
) => {
  const order =
    await paymentRepository.findOrderForPayment(
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
    "payment_pending"
  ) {
    const error = new Error(
      `Payment cannot be failed when order status is "${order.status}".`
    );

    error.statusCode = 400;

    throw error;
  }

  return paymentRepository.failPayment(
    orderId,
    {
      ...data,
      updatedBy:
        userId,
    }
  );
};