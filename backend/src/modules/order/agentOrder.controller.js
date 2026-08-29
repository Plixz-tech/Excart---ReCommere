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

  async startTransit(req, res, next) {
    try {
      const order =
        await orderService.startTransit(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message: "Order moved to transit successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentOrderController();