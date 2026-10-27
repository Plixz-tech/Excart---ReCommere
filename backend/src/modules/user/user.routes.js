import express from "express";
import * as userController from "./user.controller.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";
import validateQuery from "../../middlewares/validation/validateQuery.js";
import {
  userIdSchema,
  getUsersSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "./user.validator.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin"),
  validateQuery(getUsersSchema),
  userController.getUsers
);

router.get(
  "/:id/details",
  protect,
  authorize("admin"),
  validateParams(userIdSchema),
  userController.getUserDetails
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(userIdSchema),
  userController.getUserById
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(userIdSchema),
  validateRequest(updateUserSchema),
  userController.updateUser
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  validateParams(userIdSchema),
  validateRequest(updateUserStatusSchema),
  userController.updateUserStatus
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(userIdSchema),
  userController.deleteUser
);

export default router;