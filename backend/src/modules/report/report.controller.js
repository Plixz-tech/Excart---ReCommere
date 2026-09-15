import reportService from "./report.service.js";

class ReportController {
  async getDashboard(req, res, next) {
    try {
      const dashboard = await reportService.getDashboard();

      return res.status(200).json({
        success: true,
        message: "Report dashboard fetched successfully.",
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderReport(req, res, next) {
    try {
      const result = await reportService.getOrderReport(
        req.query
      );

      return res.status(200).json({
        success: true,
        message: "Order report fetched successfully.",
        data: result.orders,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentReport(req, res, next) {
    try {
      const result =
        await reportService.getPaymentReport();

      return res.status(200).json({
        success: true,
        message: "Payment report fetched successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryReport(req, res, next) {
    try {
      const result =
        await reportService.getInventoryReport();

      return res.status(200).json({
        success: true,
        message: "Inventory report fetched successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAgentEarningReport(req, res, next) {
    try {
      const result =
        await reportService.getAgentEarningReport();

      return res.status(200).json({
        success: true,
        message: "Agent earning report fetched successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeviceReport(req, res, next) {
    try {
      const result =
        await reportService.getDeviceReport();

      return res.status(200).json({
        success: true,
        message: "Device report fetched successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();