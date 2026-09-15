import Notification from "../../models/Notification.js";

class NotificationRepository {
  // CREATE NOTIFICATION
  async create(notificationData) {
    return Notification.create(
      notificationData
    );
  }

  // CREATE MULTIPLE NOTIFICATIONS
  async createMany(notifications) {
    if (!notifications?.length) {
      return [];
    }

    return Notification.insertMany(
      notifications
    );
  }

  // FIND NOTIFICATION BY ID
  async findById(notificationId) {
    return Notification.findById(
      notificationId
    ).populate(
      "order",
      "orderNumber status pickup.scheduledDate pickup.scheduledTime"
    );
  }

  // FIND USER NOTIFICATIONS
  async findByRecipient(
    recipientId,
    options = {}
  ) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
    } = options;

    const safePage = Math.max(
      Number(page) || 1,
      1
    );

    const safeLimit = Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

    const filter = {
      recipient: recipientId,
    };

    if (unreadOnly) {
      filter.isRead = false;
    }

    const skip =
      (safePage - 1) * safeLimit;

    const [notifications, total] =
      await Promise.all([
        Notification.find(filter)
          .populate(
            "order",
            "orderNumber status pickup.scheduledDate pickup.scheduledTime"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(safeLimit),

        Notification.countDocuments(
          filter
        ),
      ]);

    return {
      notifications,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages:
        Math.ceil(
          total / safeLimit
        ),
    };
  }

  // MARK ONE NOTIFICATION AS READ
  async markAsRead(notificationId) {
    return Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        new: true,
      }
    ).populate(
      "order",
      "orderNumber status pickup.scheduledDate pickup.scheduledTime"
    );
  }

  // MARK ALL USER NOTIFICATIONS AS READ
  async markAllAsRead(recipientId) {
    return Notification.updateMany(
      {
        recipient: recipientId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );
  }

  // DELETE NOTIFICATION
  async deleteById(notificationId) {
    return Notification.findByIdAndDelete(
      notificationId
    );
  }

  // COUNT UNREAD NOTIFICATIONS
  async countUnread(recipientId) {
    return Notification.countDocuments({
      recipient: recipientId,
      isRead: false,
    });
  }
}

export default new NotificationRepository();