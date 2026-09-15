import notificationService from "./notification.service.js";

class NotificationController {
  // GET MY NOTIFICATIONS
  async getMyNotifications(req, res, next) {
    try {
      const result =
        await notificationService.getMyNotifications(
          req.user.userId,
          req.query
        );

      return res.status(200).json({
        success: true,
        message:
          "Notifications fetched successfully.",
        data: result.notifications,
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

  // GET ONE NOTIFICATION
  async getNotificationById(req, res, next) {
    try {
      const notification =
        await notificationService.getNotificationById(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification fetched successfully.",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  // MARK ONE AS READ
  async markAsRead(req, res, next) {
    try {
      const notification =
        await notificationService.markAsRead(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification marked as read.",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  // MARK ALL AS READ
  async markAllAsRead(req, res, next) {
    try {
      const result =
        await notificationService.markAllAsRead(
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET UNREAD COUNT
  async getUnreadCount(req, res, next) {
    try {
      const result =
        await notificationService.getUnreadCount(
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Unread notification count fetched successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE NOTIFICATION
  async deleteNotification(req, res, next) {
    try {
      const result =
        await notificationService.deleteNotification(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification deleted successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();