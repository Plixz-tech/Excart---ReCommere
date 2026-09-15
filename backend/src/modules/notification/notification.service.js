import notificationRepository from "./notification.repository.js";
import ApiError from "../../utils/errors/ApiError.js";

class NotificationService {
  // CREATE NOTIFICATION
  async createNotification(data) {
    const {
      recipient,
      title,
      message,
      type = "general",
      order = null,
      metadata = {},
    } = data;

    if (!recipient) {
      throw new ApiError(
        400,
        "Notification recipient is required."
      );
    }

    if (!title?.trim()) {
      throw new ApiError(
        400,
        "Notification title is required."
      );
    }

    if (!message?.trim()) {
      throw new ApiError(
        400,
        "Notification message is required."
      );
    }

    return notificationRepository.create({
      recipient,
      title: title.trim(),
      message: message.trim(),
      type,
      order,
      metadata,
    });
  }

  // CREATE MULTIPLE NOTIFICATIONS
  async createNotifications(notifications) {
    if (!Array.isArray(notifications)) {
      throw new ApiError(
        400,
        "Notifications must be an array."
      );
    }

    if (!notifications.length) {
      return [];
    }

    const validatedNotifications = notifications.map(
      (notification) => {
        const {
          recipient,
          title,
          message,
          type = "general",
          order = null,
          metadata = {},
        } = notification;

        if (!recipient) {
          throw new ApiError(
            400,
            "Notification recipient is required."
          );
        }

        if (!title?.trim()) {
          throw new ApiError(
            400,
            "Notification title is required."
          );
        }

        if (!message?.trim()) {
          throw new ApiError(
            400,
            "Notification message is required."
          );
        }

        return {
          recipient,
          title: title.trim(),
          message: message.trim(),
          type,
          order,
          metadata,
        };
      }
    );

    return notificationRepository.createMany(
      validatedNotifications
    );
  }

  // GET MY NOTIFICATIONS
  async getMyNotifications(
    userId,
    options = {}
  ) {
    return notificationRepository.findByRecipient(
      userId,
      options
    );
  }

  // GET ONE NOTIFICATION
  async getNotificationById(
    notificationId,
    userId
  ) {
    const notification =
      await notificationRepository.findById(
        notificationId
      );

    if (!notification) {
      throw new ApiError(
        404,
        "Notification not found."
      );
    }

    if (
      notification.recipient.toString() !==
      userId.toString()
    ) {
      throw new ApiError(
        403,
        "You are not allowed to access this notification."
      );
    }

    return notification;
  }

  // MARK ONE AS READ
  async markAsRead(
    notificationId,
    userId
  ) {
    const notification =
      await notificationRepository.findById(
        notificationId
      );

    if (!notification) {
      throw new ApiError(
        404,
        "Notification not found."
      );
    }

    if (
      notification.recipient.toString() !==
      userId.toString()
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update this notification."
      );
    }

    return notificationRepository.markAsRead(
      notificationId
    );
  }

  // MARK ALL AS READ
  async markAllAsRead(userId) {
    return notificationRepository.markAllAsRead(
      userId
    );
  }

  // GET UNREAD COUNT
  async getUnreadCount(userId) {
    const count =
      await notificationRepository.countUnread(
        userId
      );

    return {
      count,
    };
  }

  // DELETE NOTIFICATION
  async deleteNotification(
    notificationId,
    userId
  ) {
    const notification =
      await notificationRepository.findById(
        notificationId
      );

    if (!notification) {
      throw new ApiError(
        404,
        "Notification not found."
      );
    }

    if (
      notification.recipient.toString() !==
      userId.toString()
    ) {
      throw new ApiError(
        403,
        "You are not allowed to delete this notification."
      );
    }

    await notificationRepository.deleteById(
      notificationId
    );

    return {
      message:
        "Notification deleted successfully.",
    };
  }
}

export default new NotificationService();