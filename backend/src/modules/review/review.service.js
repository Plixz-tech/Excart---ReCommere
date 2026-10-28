
import reviewRepository from "./review.repository.js";
import orderRepository from "../order/order.repository.js";
import ApiError from "../../utils/errors/ApiError.js";

class ReviewService {
  formatReview(review) {
    return {
      id: review._id,

      user: {
        name: review.user?.fullName || "Anonymous",
        profileImage: review.user?.profileImage || null,
        location: review.order?.pickup?.address?.city || "",
      },

      device: {
        name: [
          review.device?.brand,
          review.device?.model,
          review.device?.variant,
        ]
          .filter(Boolean)
          .join(" "),

        amount: review.order?.payment?.finalAmount || 0,
      },

      rating: review.rating,
      comment: review.comment || "",
      createdAt: review.createdAt,
    };
  }

  async createReview(userId, data) {
    const { orderId, rating, comment = "" } = data;

    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (
      !order.customer ||
      order.customer._id.toString() !== userId.toString()
    ) {
      throw new ApiError(
        403,
        "You are not authorized to review this order"
      );
    }

    const reviewableStatuses = [
      "payment_pending",
      "payment_completed",
      "in_transit",
      "inspection_pending",
      "inspection_in_progress",
      "inspection_completed",
      "approved",
      "ready_stock",
      "completed",
    ];

    if (!reviewableStatuses.includes(order.status)) {
      throw new ApiError(
        400,
        "Review can only be submitted after the order is picked up"
      );
    }

    const existingReview = await reviewRepository.findOne({
      order: orderId,
    });

    if (existingReview) {
      throw new ApiError(
        409,
        "A review has already been submitted for this order"
      );
    }

    const review = await reviewRepository.create({
      order: orderId,
      user: userId,
      device: order.device,
      rating,
      comment,
      createdBy: userId,
      updatedBy: userId,
    });

    return review;
  }

  async getuserReviews(userId) {
    const reviews = await reviewRepository.findByuser(userId);

    return reviews.map((review) =>
      this.formatReview(review)
    );
  }

  async getReviewById(reviewId) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    return this.formatReview(review);
  }

  async getAllReviews(options = {}) {
    const result = await reviewRepository.findAll({}, options);

    return {
      reviews: result.reviews.map((review) =>
        this.formatReview(review)
      ),
      pagination: result.pagination,
    };
  }

  async updateReview(reviewId, userId, data) {
    const review = await reviewRepository.findOne({
      _id: reviewId,
    });

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (String(review.user) !== String(userId)) {
      throw new ApiError(
        403,
        "You are not authorized to update this review"
      );
    }

    const updateData = {
      updatedBy: userId,
    };

    if (data.rating !== undefined) {
      updateData.rating = data.rating;
    }

    if (data.comment !== undefined) {
      updateData.comment = data.comment;
    }

    const updatedReview = await reviewRepository.updateById(
      reviewId,
      updateData
    );

    return this.formatReview(updatedReview);
  }
}

export default new ReviewService();
