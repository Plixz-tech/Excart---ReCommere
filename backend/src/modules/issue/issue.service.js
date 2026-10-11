import issueRepository from "./issue.repository.js";
import ApiError from "../../utils/errors/ApiError.js";

class IssueService {
  async createIssue(userId, data) {
    const subject = data.subject?.trim();
    const description = data.description?.trim();

    if (!subject) {
      throw new ApiError(400, "Issue subject is required.");
    }

    if (!description) {
      throw new ApiError(400, "Issue description is required.");
    }

    return issueRepository.create({
      user: userId,
      subject,
      description,
    });
  }

  async getMyIssues(userId) {
    return issueRepository.findByUser(userId);
  }

  async getIssueById(issueId) {
    const issue = await issueRepository.findById(issueId);

    if (!issue) {
      throw new ApiError(404, "Issue not found.");
    }

    return issue;
  }

  async getAllIssues(options = {}) {
    return issueRepository.findAll({}, options);
  }

  async updateIssue(issueId, data) {
    const issue = await issueRepository.findById(issueId);

    if (!issue) {
      throw new ApiError(404, "Issue not found.");
    }

    const updateData = {};

    if (data.status !== undefined) {
      const allowedStatuses = [
        "open",
        "in_progress",
        "resolved",
        "closed",
      ];

      if (!allowedStatuses.includes(data.status)) {
        throw new ApiError(400, "Invalid issue status.");
      }

      updateData.status = data.status;

      if (data.status === "resolved") {
        updateData.resolvedAt = new Date();
      }
    }

    if (data.adminResponse !== undefined) {
      updateData.adminResponse = data.adminResponse.trim();
    }

    return issueRepository.updateById(issueId, updateData);
  }
}

export default new IssueService();