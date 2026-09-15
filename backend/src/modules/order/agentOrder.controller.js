import orderService from "./order.service.js";

class AgentOrderController {

  async getMyOrders(req, res, next) {
    try {
      const result =
        await orderService.getMyAssignedOrders(
          req.user.userId,
          req.query
        );

      return res.status(200).json({
        success: true,
        message: "Assigned orders fetched successfully.",
        data: result.orders,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrderById(req, res, next) {
    try {
      const order =
        await orderService.getMyAssignedOrderById(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message: "Assigned order fetched successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async selfAssignOrder(req, res, next) {
    try {
      const order =
        await orderService.selfAssignOrder(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message: "Order assigned to you successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // CUSTOMER AADHAAR - SEND OTP

  async sendCustomerAadhaarOtp(req, res, next) {
    try {
      const result =
        await orderService.sendCustomerAadhaarOtp(
          req.params.id,
          req.user.userId,
          req.body.aadhaarNumber
        );

      return res.status(200).json({
        success: true,
        message: "Customer Aadhaar OTP sent successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // CUSTOMER AADHAAR - VERIFY OTP

  async verifyCustomerAadhaarOtp(req, res, next) {
    try {
      const order =
        await orderService.verifyCustomerAadhaarOtp(
          req.params.id,
          req.user.userId,
          req.body.otp
        );

      return res.status(200).json({
        success: true,
        message: "Customer Aadhaar verified successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // PICKUP VERIFICATION

  async verifyPickup(req, res, next) {
    try {
      const order =
        await orderService.verifyPickup(
          req.params.id,
          req.user.userId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message: "Pickup verification completed successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // PICKUP ORDER

  async pickupOrder(req, res, next) {
    try {
      const order =
        await orderService.pickupOrder(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message: "Order picked up successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // COMPLETE PAYMENT

  async completePayment(req, res, next) {
    try {
      const order =
        await orderService.completeAgentPayment(
          req.params.id,
          req.user.userId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message: "Payment completed successfully. Order moved to transit.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentOrderController();