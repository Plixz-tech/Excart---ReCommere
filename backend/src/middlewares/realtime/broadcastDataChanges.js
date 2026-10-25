
import { getIO } from "../../config/socket/index.js";

const broadcastDataChanges = ({
  entity,
  action,
  recordId,
  userId,
  agentId,
  orderId,
  notifyAdmins = true,
}) => {
  if (!entity || !action) {
    throw new Error("Entity and action are required for a real-time event.");
  }

  const payload = {
    entity,
    action,
    ...(recordId ? { recordId: String(recordId) } : {}),
    timestamp: new Date().toISOString(),
  };

  try {
    const io = getIO();

    if (notifyAdmins) {
      io.to("admins").emit("data:changed", payload);
    }

    if (userId) {
      io.to(`user:${userId}`).emit("data:changed", payload);
    }

    if (agentId) {
      io.to(`agent:${agentId}`).emit("data:changed", payload);
    }

    if (orderId) {
      io.to(`order:${orderId}`).emit("data:changed", payload);
    }
  } catch (error) {
    // Real-time failures must not undo a successful business operation.
    console.error(
      "Failed to broadcast real-time data change:",
      error.message,
    );
  }
};

export default broadcastDataChanges;
