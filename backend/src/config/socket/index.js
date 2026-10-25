
import { Server } from "socket.io";
import mongoose from "mongoose";

import { verifyAccessToken } from "../../lib/jwt.js";
import { findUserById } from "../../modules/auth/auth.repository.js";
import Order from "../../models/Order.js";
import AgentLocation from "../../models/AgentLocation.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // SOCKET AUTHENTICATION
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Access token is missing."));
      }

      const decoded = verifyAccessToken(token);
      const user = await findUserById(decoded.userId);

      if (!user) {
        return next(new Error("User not found."));
      }

      // Reject blocked and deleted accounts.
      if (user.status === "blocked" || user.status === "deleted") {
        return next(
          new Error(
            user.status === "deleted"
              ? "This account is no longer available."
              : "Your account has been blocked."
          )
        );
      }

      socket.user = {
        userId: user._id.toString(),
        role: user.role,
        phone: user.phone,
        email: user.email,
      };

      next();
    } catch (error) {
      next(new Error("Invalid or expired access token."));
    }
  });

  // SOCKET CONNECTION
  io.on("connection", (socket) => {
    const { userId, role } = socket.user;

    console.log(
      `Socket connected: ${socket.id} | User: ${userId} | Role: ${role}`
    );

    // PERSONAL USER ROOM
    socket.join(`user:${userId}`);

    // AGENT ROOM
    if (role === "agent") {
      socket.join(`agent:${userId}`);

      console.log(`Agent ${userId} joined room agent:${userId}`);
    }

    // ADMIN ROOM
    if (role === "admin") {
      socket.join("admins");

      console.log(`Admin ${userId} joined admin room`);
    }

    // JOIN ORDER ROOM
    socket.on("join_order", async (orderId) => {
      try {
        if (!orderId) {
          socket.emit("socket_error", {
            message: "Order ID is required.",
          });
          return;
        }

        if (!mongoose.isValidObjectId(orderId)) {
          socket.emit("socket_error", {
            message: "Invalid order ID.",
          });
          return;
        }

        const order = await Order.findById(orderId);

        if (!order) {
          socket.emit("socket_error", {
            message: "Order not found.",
          });
          return;
        }

        // CUSTOMER ACCESS
        if (role === "user") {
          if (
            !order.customer ||
            order.customer.toString() !== userId
          ) {
            socket.emit("socket_error", {
              message: "You are not allowed to track this order.",
            });
            return;
          }
        }

        // AGENT ACCESS
        if (role === "agent") {
          const assignedAgent =
            order.agent || order.pickup?.assignedAgent;

          if (
            !assignedAgent ||
            assignedAgent.toString() !== userId
          ) {
            socket.emit("socket_error", {
              message: "You are not assigned to this order.",
            });
            return;
          }
        }

        // Only authorized users reach this point.
        // Admins can join any order room.
        socket.join(`order:${orderId}`);

        console.log(`User ${userId} joined order:${orderId}`);

        socket.emit("order_joined", {
          orderId,
        });
      } catch (error) {
        console.error("Socket join_order error:", error);

        socket.emit("socket_error", {
          message: "Unable to join order room.",
        });
      }
    });

    // AGENT LOCATION UPDATE
    socket.on("agent_location_update", async (data) => {
      try {
        // Only agents can send location updates.
        if (role !== "agent") {
          socket.emit("socket_error", {
            message: "Only agents can send location updates.",
          });
          return;
        }

        const { orderId, latitude, longitude } = data || {};

        // VALIDATE ORDER ID
        if (!orderId) {
          socket.emit("socket_error", {
            message: "Order ID is required.",
          });
          return;
        }

        if (!mongoose.isValidObjectId(orderId)) {
          socket.emit("socket_error", {
            message: "Invalid order ID.",
          });
          return;
        }

        // VALIDATE LATITUDE
        if (
          typeof latitude !== "number" ||
          latitude < -90 ||
          latitude > 90
        ) {
          socket.emit("socket_error", {
            message: "Invalid latitude.",
          });
          return;
        }

        // VALIDATE LONGITUDE
        if (
          typeof longitude !== "number" ||
          longitude < -180 ||
          longitude > 180
        ) {
          socket.emit("socket_error", {
            message: "Invalid longitude.",
          });
          return;
        }

        // FIND ORDER
        const order = await Order.findById(orderId);

        if (!order) {
          socket.emit("socket_error", {
            message: "Order not found.",
          });
          return;
        }

        // VERIFY AGENT ASSIGNMENT
        const assignedAgent =
          order.agent || order.pickup?.assignedAgent;

        if (
          !assignedAgent ||
          assignedAgent.toString() !== userId
        ) {
          socket.emit("socket_error", {
            message: "You are not assigned to this order.",
          });
          return;
        }

        // CHECK TRACKING STATUS
        const allowedStatuses = [
          "assigned",
          "pickup_scheduled",
          "picked_up",
          "in_transit",
        ];

        if (!allowedStatuses.includes(order.status)) {
          socket.emit("socket_error", {
            message: "Location tracking is not active for this order.",
          });
          return;
        }

        // SAVE LOCATION
        const location = await AgentLocation.findOneAndUpdate(
          { agent: userId },
          {
            $set: {
              order: order._id,
              latitude,
              longitude,
              status: "online",
              lastUpdatedAt: new Date(),
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

        const locationData = {
          agentId: userId,
          orderId: order._id.toString(),
          latitude: location.latitude,
          longitude: location.longitude,
          status: location.status,
          lastUpdatedAt: location.lastUpdatedAt,
        };

        // SEND LOCATION TO AUTHORIZED ORDER ROOM
        io.to(`order:${orderId}`).emit(
          "location_updated",
          locationData
        );

        // SEND LOCATION TO ADMINS
        io.to("admins").emit(
          "location_updated",
          locationData
        );

        // CONFIRM UPDATE TO AGENT
        socket.emit("location_update_success", {
          orderId: order._id.toString(),
          latitude: location.latitude,
          longitude: location.longitude,
          lastUpdatedAt: location.lastUpdatedAt,
        });
      } catch (error) {
        console.error("Socket agent_location_update error:", error);

        socket.emit("socket_error", {
          message: "Unable to update agent location.",
        });
      }
    });

    // LEAVE ORDER ROOM
    socket.on("leave_order", (orderId) => {
      if (!orderId || !mongoose.isValidObjectId(orderId)) {
        return;
      }

      socket.leave(`order:${orderId}`);

      console.log(`User ${userId} left order:${orderId}`);
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      console.log(
        `Socket disconnected: ${socket.id} | User: ${userId}`
      );

      // Only agents have live location status.
      if (role !== "agent") {
        return;
      }

      try {
        await AgentLocation.findOneAndUpdate(
          { agent: userId },
          {
            $set: {
              status: "offline",
              lastUpdatedAt: new Date(),
            },
          },
          {
            new: true,
          }
        );

        console.log(
          `Agent ${userId} location status set to offline`
        );
      } catch (error) {
        console.error(
          `Failed to set agent ${userId} offline:`,
          error
        );
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
};
