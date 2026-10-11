import { Router } from "express";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import issueController from "./issue.controller.js";

const router = Router();

// User — Report an issue
router.post(
  "/",
  protect,
  authorize("user"),
  issueController.createIssue
);

// User — View own issues
router.get(
  "/my",
  protect,
  authorize("user"),
  issueController.getMyIssues
);

// Admin — View all issues
router.get(
  "/",
  protect,
  authorize("admin"),
  issueController.getAllIssues
);

// User/Admin — View single issue
router.get(
  "/:issueId",
  protect,
  authorize("user", "admin"),
  issueController.getIssueById
);

// Admin — Update issue / respond
router.patch(
  "/:issueId",
  protect,
  authorize("admin"),
  issueController.updateIssue
);

export default router;