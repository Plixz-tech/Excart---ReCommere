import Review from "../../models/Review.js";

const reviewPopulate = (query) =>
  query
    .populate(
      "user",
      "fullName profileImage"
    )
    .populate(
      "order",
      "orderNumber status pickup payment"
    )
    .populate(
      "device",
      "brand model variant storage ram"
    );

class ReviewRepository {
  async create(data) {
    return Review.create(data);
  }

  async findById(reviewId) {
    return reviewPopulate(
      Review.findById(reviewId)
    );
  }

  async findOne(filter = {}) {
    return Review.findOne(filter);
  }

  async findByuser(userId) {
    return reviewPopulate(
      Review.find({ user: userId })
    ).sort({ createdAt: -1 });
  }

  async findAll(filter = {}, options = {}) {
    const page = Math.max(
      Number(options.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(options.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      reviewPopulate(
        Review.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      ),

      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(reviewId, data) {
    return reviewPopulate(
      Review.findByIdAndUpdate(
        reviewId,
        data,
        {
          new: true,
          runValidators: true,
        }
      )
    );
  }
}

export default new ReviewRepository();