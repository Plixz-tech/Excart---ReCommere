import Issue from "../../models/Issue.js";

class IssueRepository {
  async create(data) {
    return Issue.create(data);
  }

  async findById(issueId) {
    return Issue.findById(issueId).populate(
      "user",
      "fullName email profileImage"
    );
  }

  async findByUser(userId) {
    return Issue.find({ user: userId }).sort({ createdAt: -1 });
  }

  async findAll(filter = {}, options = {}) {
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(options.limit) || 10, 1),
      100
    );
    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate("user", "fullName email profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Issue.countDocuments(filter),
    ]);

    return {
      issues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(issueId, data) {
    return Issue.findByIdAndUpdate(issueId, data, {
      new: true,
      runValidators: true,
    }).populate("user", "fullName email profileImage");
  }
}

export default new IssueRepository();