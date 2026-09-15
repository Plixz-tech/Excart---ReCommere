import express from "express";

import notificationController from "./notification.controller.js";

import {
  notificationIdSchema,
  notificationListSchema,
} from "./notification.validator.js";

import validateParams from "../../middlewares/validation/validateParams.js";
import validateQuery from "../../middlewares/validation/validateQuery.js";
import protect from "../../middlewares/auth/protect.js";

const router = express.Router();

router.use(protect);


// GET MY NOTIFICATIONS

router.get(
  "/",
  validateQuery(notificationListSchema),
  notificationController.getMyNotifications
);


// GET UNREAD COUNT

router.get(
  "/unread-count",
  notificationController.getUnreadCount
);


// GET ONE NOTIFICATION

router.get(
  "/:id",
  validateParams(notificationIdSchema),
  notificationController.getNotificationById
);


// MARK ONE AS READ

router.patch(
  "/:id/read",
  validateParams(notificationIdSchema),
  notificationController.markAsRead
);


// MARK ALL AS READ

router.patch(
  "/read-all",
  notificationController.markAllAsRead
);


// DELETE NOTIFICATION

router.delete(
  "/:id",
  validateParams(notificationIdSchema),
  notificationController.deleteNotification
);

export default router;