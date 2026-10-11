import mongoose from "mongoose";
import agentTrackingRepository from "./agentTracking.repository.js";
import Order from "../../models/Order.js";

class AgentTrackingService {
  async updateAgentLocation(agentId, data) {
    const { latitude, longitude, orderId } = data;

    let order = null;

    if (orderId) {
      if (!mongoose.isValidObjectId(orderId)) {
        const error = new Error("Invalid order ID.");
        error.statusCode = 400;
        throw error;
      }

      order = await Order.findById(orderId);

      if (!order) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      const assignedAgent =
        order.agent ||
        order.pickup?.assignedAgent;

      if (
        !assignedAgent ||
        assignedAgent.toString() !== agentId.toString()
      ) {
        const error = new Error(
          "You are not assigned to this order."
        );
        error.statusCode = 403;
        throw error;
      }

      const allowedStatuses = [
        "assigned",
        "pickup_scheduled",
        "picked_up",
        "in_transit",
      ];

      if (!allowedStatuses.includes(order.status)) {
        const error = new Error(
          "Location tracking is not active for this order."
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const existingLocation =
      await agentTrackingRepository.findByAgent(agentId);

    return agentTrackingRepository.upsertByAgent(
      agentId,
      {
        latitude,
        longitude,
        order: order
          ? order._id
          : existingLocation?.order?._id ||
            existingLocation?.order ||
            null,
        status: "online",
      }
    );
  }

  async getMyLocation(agentId) {
    const location =
      await agentTrackingRepository.findByAgent(agentId);

    if (!location) {
      const error = new Error(
        "Agent location not found."
      );
      error.statusCode = 404;
      throw error;
    }

    return location;
  }

  async getOrderTracking(orderId, userId, userRole) {
    if (!mongoose.isValidObjectId(orderId)) {
      const error = new Error("Invalid order ID.");
      error.statusCode = 400;
      throw error;
    }

    const order = await Order.findById(orderId);

    if (!order) {
      const error = new Error("Order not found.");
      error.statusCode = 404;
      throw error;
    }

    if (userRole === "user") {
      if (
        !order.customer ||
        order.customer.toString() !== userId.toString()
      ) {
        const error = new Error(
          "You are not allowed to track this order."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    if (userRole === "agent") {
      const assignedAgent =
        order.agent ||
        order.pickup?.assignedAgent;

      if (
        !assignedAgent ||
        assignedAgent.toString() !== userId.toString()
      ) {
        const error = new Error(
          "You are not assigned to this order."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    const location =
      await agentTrackingRepository.findByOrder(orderId);

    if (!location) {
      const error = new Error(
        "Agent location is not available yet."
      );
      error.statusCode = 404;
      throw error;
    }

    return location;
  }

 async getAllActiveLocations() {
  const staleThreshold = new Date(
    Date.now() - 5 * 60 * 1000
  );

  return agentTrackingRepository.findAll({
    status: "online",
    lastUpdatedAt: {
      $gte: staleThreshold,
    },
  });
}

  async setAgentOffline(agentId) {
    const location =
      await agentTrackingRepository.updateByAgent(
        agentId,
        {
          status: "offline",
          lastUpdatedAt: new Date(),
        }
      );

    if (!location) {
      const error = new Error(
        "Agent location not found."
      );
      error.statusCode = 404;
      throw error;
    }

    return location;
  }
}

export default new AgentTrackingService();