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
  const now = new Date();
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Current month
  const currentStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const currentEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  // Previous month
  const previousStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const previousEnd = currentStart;

  // Today and yesterday
  const { startOfDay, endOfDay } =
    this.getDayRange(now);

  const yesterdayStart = new Date(startOfDay);
  yesterdayStart.setDate(
    yesterdayStart.getDate() - 1
  );

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
    agentPerformance,
    inspectionSummary,
    pickupManagement,
    comparisons,
    inventoryBrandSummary,
    orderTrend,
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

    reportRepository.getAgentPerformance(),

    reportRepository.getInspectionSummary(),

    reportRepository.getPickupManagement(
      startOfDay,
      endOfDay
    ),

    reportRepository.getDashboardPeriodComparisons({
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      todayStart: startOfDay,
      tomorrowStart: endOfDay,
      yesterdayStart,
    }),

    reportRepository.getInventoryBrandSummary(),
    reportRepository.getOrderTrend(trendStart),
  ]);

  const calculateChange = (current, previous) => {
    if (previous === 0) {
      return current === 0 ? 0 : null;
    }

    return Number(
      (((current - previous) / previous) * 100).toFixed(1)
    );
  };

  return {
    overview: {
      totalOrders,
      activeAgents,
      pendingInspections,
      inventoryDevices,
      todayPickups,
    },

    comparisons: {
      totalOrders: {
        current: comparisons.orders.current,
        previous: comparisons.orders.previous,
        percentageChange: calculateChange(
          comparisons.orders.current,
          comparisons.orders.previous
        ),
      },

      todayPickups: {
        current: comparisons.pickups.today,
        previous: comparisons.pickups.yesterday,
        percentageChange: calculateChange(
          comparisons.pickups.today,
          comparisons.pickups.yesterday
        ),
      },
    },

    orderPipeline,

    pipelineChanges: comparisons.pipelineChanges,

    recentOrders,

    pendingPayments,

    payments: this.formatPaymentSummary(
      paymentSummary
    ),

    inventory: this.formatInventorySummary(
      inventorySummary
    ),

    agentEarnings: this.formatAgentEarningSummary(
      agentEarningSummary
    ),

    agentPerformance,
    inspectionSummary,
    pickupManagement,
    inventoryBrands: inventoryBrandSummary.map((item) => ({
      brand: item._id || "Unknown",
      count: item.count || 0,
    })),
    orderTrend: this.formatOrderTrend(orderTrend, trendStart, now),
  };
}

  formatOrderTrend(summary, startDate, endDate) {
    const counts = new Map(summary.map((item) => [`${item._id.year}-${item._id.month}`, item.count || 0]));
    const result = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth() + 1;
      result.push({
        year,
        month,
        label: cursor.toLocaleString("en-IN", { month: "short" }),
        count: counts.get(`${year}-${month}`) || 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return result;
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
      in_inventory: {
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
        const error = new Error(
          "Invalid agent ID."
        );

        error.statusCode = 400;

        throw error;
      }

      filter.agent =
        new mongoose.Types.ObjectId(agent);
    }

    if (customer) {
      if (!mongoose.isValidObjectId(customer)) {
        const error = new Error(
          "Invalid customer ID."
        );

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

    return this.formatPaymentSummary(
      summary
    );
  }

  async getInventoryReport() {
    const summary =
      await reportRepository.getInventorySummary();

    return this.formatInventorySummary(
      summary
    );
  }

  async getAgentEarningReport() {
    const summary =
      await reportRepository.getAgentEarningSummary();

    return this.formatAgentEarningSummary(
      summary
    );
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