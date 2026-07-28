import express from "express";
import * as userController from "./user.controller.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin"),
  userController.getUsers
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  userController.getUserById
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  userController.updateUser
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  userController.updateUserStatus
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  userController.deleteUser
);
export default router;