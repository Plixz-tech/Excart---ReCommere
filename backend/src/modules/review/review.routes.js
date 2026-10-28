
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

// Public: Get all reviews
router.get(
  "/",
  reviewController.getAllReviews
);

// Authenticated users: Get their own reviews
// Keep this before /:reviewId
router.get(
  "/my",
  protect,
  authorize("user"),
  reviewController.getMyReviews
);

// Public: Get a single review
router.get(
  "/:reviewId",
  reviewController.getReviewById
);

// Authenticated users: Create a review
router.post(
  "/",
  protect,
  authorize("user"),
  validateRequest(createReviewSchema),
  reviewController.createReview
);

// Authenticated users: Update their own reviews
router.patch(
  "/:reviewId",
  protect,
  authorize("user"),
  validateRequest(updateReviewSchema),
  reviewController.updateReview
);

export default router;
