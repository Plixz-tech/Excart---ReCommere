import orderService from "./order.service.js";

class AdminOrderController {

  async getOrders(req, res, next) {
    try {
      const result = await orderService.getOrders(req.query);

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

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(
        req.params.id
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

  async updateOrder(req, res, next) {
    try {
      const order = await orderService.updateOrder(
        req.params.id,
        req.body,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Order updated successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignOrder(req, res, next) {
    try {
      const order = await orderService.assignOrder(
        req.params.id,
        req.body.agentId,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Order assigned successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

    async processPayment(req, res, next) {
    try {
      const order = await orderService.processPayment(
        req.params.id,
        req.body,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Payment completed successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }


  async receiveOrder(req, res, next) {
    try {
      const order = await orderService.receiveOrder(
        req.params.id,
        req.user.userId
      );

      return res.status(200).json({
        success: true,
        message: "Device received successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseInvoice(req, res, next) {
    try {
      const invoice =
        await orderService.getPurchaseInvoice(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        message: "Purchase invoice fetched successfully.",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentSlip(req, res, next) {
    try {
      const slip =
        await orderService.getPaymentSlip(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        message: "Payment slip fetched successfully.",
        data: slip,
      });
    } catch (error) {
      next(error);
    }
  }

async deleteOrder(req, res, next) {
  try {
    await orderService.deleteOrder(
      req.params.id,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}
}

export default new AdminOrderController();