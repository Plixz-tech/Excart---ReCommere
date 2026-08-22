import orderService from "./order.service.js";

class OrderController {
  async createOrder(req, res, next) {
    try {
      const userId = req.user.userId;

      const order = await orderService.createOrder(
        req.body,
        userId
      );

      return res.status(201).json({
        success: true,
        message: "Order created successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await orderService.getMyOrders(
        userId,
        req.query
      );

      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully.",
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
      const userId = req.user.userId;

      const order =
        await orderService.getMyOrderById(
          req.params.id,
          userId
        );

      return res.status(200).json({
        success: true,
        message: "Order fetched successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const userId = req.user.userId;

      const order =
        await orderService.cancelOrder(
          req.params.id,
          userId
        );

      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadDeviceInvoice(req, res, next) {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      const error = new Error(
        "Device invoice file is required."
      );

      error.statusCode = 400;

      throw error;
    }

    const order =
      await orderService.uploadDeviceInvoice(
        req.params.id,
        req.file,
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Device invoice uploaded successfully.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}
}

export default new OrderController();