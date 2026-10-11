import { Router } from "express";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";

import reviewController from "./review.controller.js";
import {
  createReviewSchema,
  updateReviewSchema,
} from "./review.validator.js";

const router = Router();

/**
 * user
 */

// Create review
router.post(
  "/",
  protect,
  authorize("user"),
  validateRequest(createReviewSchema),
  reviewController.createReview
);

// Get logged-in user's reviews
router.get(
  "/my",
  protect,
  authorize("user"),
  reviewController.getMyReviews
);

// Get single review
router.get(
  "/:reviewId",
  protect,
  authorize("user", "admin"),
  reviewController.getReviewById
);

// Update user's review
router.patch(
  "/:reviewId",
  protect,
  authorize("user"),
  validateRequest(updateReviewSchema),
  reviewController.updateReview
);

/**
 * Admin
 */

// Get all reviews
router.get(
  "/",
  protect,
  authorize("admin"),
  reviewController.getAllReviews
);

export default router;