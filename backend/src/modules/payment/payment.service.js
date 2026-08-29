import * as paymentRepository from "./payment.repository.js";

export const getPaymentByOrderId = async (
  orderId
) => {
  return await paymentRepository.getPaymentByOrderId(
    orderId
  );
};

export const getPayments = async (
  queryParams
) => {
  return await paymentRepository.getPayments(
    queryParams
  );
};

export const updatePayment = async (
  orderId,
  paymentData,
  userId
) => {
  const order =
    await paymentRepository.findOrderForPayment(
      orderId
    );

  if (order.status !== "payment_pending") {
    const error = new Error(
      `Payment cannot be updated because the order status is "${order.status}".`
    );

    error.statusCode = 400;

    throw error;
  }

  if (order.payment.status === "completed") {
    const error = new Error(
      "Payment has already been completed."
    );

    error.statusCode = 400;

    throw error;
  }

  if (
    paymentData.finalAmount !== undefined
  ) {
    const finalAmount = Number(
      paymentData.finalAmount
    );

    if (
      !Number.isFinite(finalAmount) ||
      finalAmount < 0
    ) {
      const error = new Error(
        "A valid final payment amount is required."
      );

      error.statusCode = 400;

      throw error;
    }
  }

  return await paymentRepository.updatePayment(
    order,
    paymentData,
    userId
  );
};

export const completePayment = async (
  orderId,
  paymentData,
  userId
) => {
  const order =
    await paymentRepository.findOrderForPayment(
      orderId
    );

  if (order.status !== "payment_pending") {
    const error = new Error(
      `Payment cannot be completed because the order status is "${order.status}".`
    );

    error.statusCode = 400;

    throw error;
  }

  if (order.payment.status === "completed") {
    const error = new Error(
      "Payment has already been completed."
    );

    error.statusCode = 400;

    throw error;
  }

  const finalAmount =
    paymentData.finalAmount !== undefined
      ? Number(paymentData.finalAmount)
      : Number(
          order.payment.finalAmount
        );

  if (
    !Number.isFinite(finalAmount) ||
    finalAmount <= 0
  ) {
    const error = new Error(
      "A valid final payment amount greater than zero is required."
    );

    error.statusCode = 400;

    throw error;
  }

  const updatedPaymentData = {
    ...paymentData,
    finalAmount,
  };

  return await paymentRepository.completePayment(
    order,
    updatedPaymentData,
    userId
  );
};

export const failPayment = async (
  orderId,
  paymentData,
  userId
) => {
  const order =
    await paymentRepository.findOrderForPayment(
      orderId
    );

  if (order.status !== "payment_pending") {
    const error = new Error(
      `Payment cannot be marked as failed because the order status is "${order.status}".`
    );

    error.statusCode = 400;

    throw error;
  }

  if (order.payment.status === "completed") {
    const error = new Error(
      "A completed payment cannot be marked as failed."
    );

    error.statusCode = 400;

    throw error;
  }

  return await paymentRepository.failPayment(
    order,
    paymentData,
    userId
  );
};