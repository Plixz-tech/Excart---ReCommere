import orderService from "./order.service.js";

class AgentOrderController {
 
  // GET ALL ORDERS ASSIGNED TO LOGGED-IN AGENT
 

  async getMyOrders(req, res, next) {
    try {
      const result =
        await orderService.getMyAssignedOrders(
          req.user.userId,
          req.query
        );

      return res.status(200).json({
        success: true,
        message:
          "Assigned orders fetched successfully.",
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

 
  // GET ONE ORDER ASSIGNED TO LOGGED-IN AGENT
 

  async getMyOrderById(req, res, next) {
    try {
      const result =
        await orderService.getMyAssignedOrderById(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Assigned order fetched successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async pickupOrder(req, res, next) {
  try {
    const result =
      await orderService.pickupOrder(
        req.params.id,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message: "Order picked up successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async startTransit(req, res, next) {
  try {
    const result =
      await orderService.startTransit(
        req.params.id,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Order moved to transit successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
}



export default new AgentOrderController();