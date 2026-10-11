import issueService from "./issue.service.js";

class IssueController {
  async createIssue(req, res) {
    const issue = await issueService.createIssue(
      req.user.userId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Issue reported successfully.",
      data: issue,
    });
  }

  async getMyIssues(req, res) {
    const issues = await issueService.getMyIssues(req.user.userId);

    res.status(200).json({
      success: true,
      data: issues,
    });
  }

  async getIssueById(req, res) {
    const issue = await issueService.getIssueById(
      req.params.issueId
    );

    res.status(200).json({
      success: true,
      data: issue,
    });
  }

  async getAllIssues(req, res) {
    const { page, limit } = req.query;

    const result = await issueService.getAllIssues({
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.issues,
      pagination: result.pagination,
    });
  }

  async updateIssue(req, res) {
    const issue = await issueService.updateIssue(
      req.params.issueId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully.",
      data: issue,
    });
  }
}

export default new IssueController();