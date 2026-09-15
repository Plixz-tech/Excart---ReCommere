import * as paymentService from "./payment.service.js";

export const getPaymentByOrderId = async (
  req,
  res,
  next
) => {
  try {
    const payment =
      await paymentService.getPaymentByOrderId(
        req.params.orderId
      );

    return res.status(200).json({
      success: true,
      message: "Payment fetched successfully.",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};


export const getPayments = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await paymentService.getPayments(
        req.query
      );

    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const updatePayment = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await paymentService.updatePayment(
        req.params.orderId,
        req.body,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const completePayment = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await paymentService.completePayment(
        req.params.orderId,
        req.body,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message: "Payment completed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const failPayment = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await paymentService.failPayment(
        req.params.orderId,
        req.body,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message: "Payment marked as failed.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};