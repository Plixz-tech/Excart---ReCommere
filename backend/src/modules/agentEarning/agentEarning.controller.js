import agentEarningService from "./agentEarning.service.js";

class AgentEarningController {
  // AGENT - GET OWN EARNINGS

  async getMyEarnings(req, res, next) {
    try {
      const result =
        await agentEarningService.getMyEarnings(
          req.user.userId,
          req.query
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earnings fetched successfully.",
        data: result.earnings,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages:
            result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // AGENT - GET OWN EARNING BY ID

  async getMyEarningById(
    req,
    res,
    next
  ) {
    try {
      const earning =
        await agentEarningService.getMyEarningById(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earning fetched successfully.",
        data: earning,
      });
    } catch (error) {
      next(error);
    }
  }

  // AGENT - GET OWN EARNING SUMMARY

  async getMyEarningSummary(
    req,
    res,
    next
  ) {
    try {
      const summary =
        await agentEarningService.getMyEarningSummary(
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earning summary fetched successfully.",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // ADMIN - GET ALL EARNINGS

  async getAllEarnings(
    req,
    res,
    next
  ) {
    try {
      const result =
        await agentEarningService.getAllEarnings(
          req.query
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earnings fetched successfully.",
        data: result.earnings,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages:
            result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ADMIN - GET EARNING BY ID

  async getEarningById(
    req,
    res,
    next
  ) {
    try {
      const earning =
        await agentEarningService.getEarningById(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earning fetched successfully.",
        data: earning,
      });
    } catch (error) {
      next(error);
    }
  }

  // ADMIN - GET EARNING SUMMARY

  async getEarningSummary(
    req,
    res,
    next
  ) {
    try {
      const summary =
        await agentEarningService.getEarningSummary(
          req.query
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earning summary fetched successfully.",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // ADMIN - APPROVE EARNING

  async approveEarning(
    req,
    res,
    next
  ) {
    try {
      const earning =
        await agentEarningService.approveEarning(
          req.params.id,
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earning approved successfully.",
        data: earning,
      });
    } catch (error) {
      next(error);
    }
  }

  // ADMIN - MARK EARNING AS PAID

  async markEarningAsPaid(
    req,
    res,
    next
  ) {
    try {
      const earning =
        await agentEarningService.markEarningAsPaid(
          req.params.id,
          req.user.userId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earning marked as paid successfully.",
        data: earning,
      });
    } catch (error) {
      next(error);
    }
  }

  // ADMIN - CANCEL EARNING

  async cancelEarning(
    req,
    res,
    next
  ) {
    try {
      const earning =
        await agentEarningService.cancelEarning(
          req.params.id,
          req.user.userId,
          req.body.notes
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent earning cancelled successfully.",
        data: earning,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentEarningController();