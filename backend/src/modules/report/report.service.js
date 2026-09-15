import mongoose from "mongoose";
import reportRepository from "./report.repository.js";

class ReportService {
  getDayRange(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      startOfDay: start,
      endOfDay: end,
    };
  }

  async getDashboard() {
    const { startOfDay, endOfDay } = this.getDayRange();

    const [
      totalOrders,
      activeAgents,
      pendingInspections,
      inventoryDevices,
      todayPickups,
      orderPipeline,
      recentOrders,
      pendingPayments,
      paymentSummary,
      inventorySummary,
      agentEarningSummary,
    ] = await Promise.all([
      reportRepository.getTotalOrders(),

      reportRepository.getActiveAgents(),

      reportRepository.getPendingInspections(),

      reportRepository.getInventoryDevices(),

      reportRepository.getOrdersForToday(
        startOfDay,
        endOfDay
      ),

      reportRepository.getOrderPipeline(),

      reportRepository.getRecentOrders(10),

      reportRepository.getPendingPayments(10),

      reportRepository.getPaymentSummary(),

      reportRepository.getInventorySummary(),

      reportRepository.getAgentEarningSummary(),
    ]);

    return {
      overview: {
        totalOrders,
        activeAgents,
        pendingInspections,
        inventoryDevices,
        todayPickups,
      },

      orderPipeline,

      recentOrders,

      pendingPayments,

      payments: this.formatPaymentSummary(paymentSummary),

      inventory: this.formatInventorySummary(
        inventorySummary
      ),

      agentEarnings:
        this.formatAgentEarningSummary(
          agentEarningSummary
        ),
    };
  }

  formatPaymentSummary(summary) {
    return {
      totalEstimatedAmount:
        summary.totalEstimatedAmount || 0,

      totalFinalAmount:
        summary.totalFinalAmount || 0,

      completedPaymentAmount:
        summary.completedPaymentAmount || 0,

      completedPayments:
        summary.completedPayments || 0,

      pendingPaymentAmount:
        summary.pendingPaymentAmount || 0,

      pendingPayments:
        summary.pendingPayments || 0,
    };
  }

  formatInventorySummary(summary) {
    const result = {
      draft: {
        count: 0,
        purchaseAmount: 0,
        listedAmount: 0,
        soldAmount: 0,
      },

      listed: {
        count: 0,
        purchaseAmount: 0,
        listedAmount: 0,
        soldAmount: 0,
      },

      sold: {
        count: 0,
        purchaseAmount: 0,
        listedAmount: 0,
        soldAmount: 0,
      },

      removed: {
        count: 0,
        purchaseAmount: 0,
        listedAmount: 0,
        soldAmount: 0,
      },
    };

    for (const item of summary) {
      if (result[item._id]) {
        result[item._id] = {
          count: item.count || 0,
          purchaseAmount:
            item.purchaseAmount || 0,
          listedAmount:
            item.listedAmount || 0,
          soldAmount:
            item.soldAmount || 0,
        };
      }
    }

    return result;
  }

  formatAgentEarningSummary(summary) {
    const result = {
      pending: {
        count: 0,
        amount: 0,
      },

      approved: {
        count: 0,
        amount: 0,
      },

      paid: {
        count: 0,
        amount: 0,
      },

      cancelled: {
        count: 0,
        amount: 0,
      },
    };

    for (const item of summary) {
      if (result[item._id]) {
        result[item._id] = {
          count: item.count || 0,
          amount: item.amount || 0,
        };
      }
    }

    return result;
  }

  async getOrderReport(query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      agent,
      customer,
    } = query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (agent) {
      if (!mongoose.isValidObjectId(agent)) {
        const error = new Error("Invalid agent ID.");
        error.statusCode = 400;
        throw error;
      }

      filter.agent = new mongoose.Types.ObjectId(agent);
    }

    if (customer) {
      if (!mongoose.isValidObjectId(customer)) {
        const error = new Error("Invalid customer ID.");
        error.statusCode = 400;
        throw error;
      }

      filter.customer =
        new mongoose.Types.ObjectId(customer);
    }

    return reportRepository.getOrderReport(
      filter,
      {
        page: Number(page),
        limit: Number(limit),
      }
    );
  }

  async getPaymentReport() {
    const summary =
      await reportRepository.getPaymentSummary();

    return this.formatPaymentSummary(summary);
  }

  async getInventoryReport() {
    const summary =
      await reportRepository.getInventorySummary();

    return this.formatInventorySummary(summary);
  }

  async getAgentEarningReport() {
    const summary =
      await reportRepository.getAgentEarningSummary();

    return this.formatAgentEarningSummary(summary);
  }

  async getDeviceReport() {
    const result =
      await reportRepository.getDeviceReport();

    return result.map((item) => ({
      brand: item._id?.brand || "",
      model: item._id?.model || "",
      count: item.count || 0,
      totalValuation:
        item.totalValuation || 0,
      totalPurchasePrice:
        item.totalPurchasePrice || 0,
      totalExpectedSellingPrice:
        item.totalExpectedSellingPrice || 0,
    }));
  }
}

export default new ReportService();