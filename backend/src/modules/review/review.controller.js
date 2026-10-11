import reviewService from "./review.service.js";

class ReviewController {
  async createReview(req, res) {
    const review = await reviewService.createReview(
      req.user.userId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  }

  async getMyReviews(req, res) {
    const reviews = await reviewService.getuserReviews(
      req.user.userId
    );

    res.status(200).json({
      success: true,
      data: reviews,
    });
  }

  async getReviewById(req, res) {
    const review = await reviewService.getReviewById(
      req.params.reviewId
    );

    res.status(200).json({
      success: true,
      data: review,
    });
  }

  async getAllReviews(req, res) {
    const { page, limit } = req.query;

    const result = await reviewService.getAllReviews({
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  }

  async updateReview(req, res) {
    const review = await reviewService.updateReview(
      req.params.reviewId,
      req.user.userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  }
}

export default new ReviewController();