import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Inspection from "../../models/Inspection.js";
import Inventory from "../../models/Inventory.js";
import AgentEarning from "../../models/AgentEarning.js";
import Device from "../../models/Device.js";

class ReportRepository {
  // BASIC COUNTS

  async getTotalOrders(filter = {}) {
    return Order.countDocuments(filter);
  }

  async getActiveAgents() {
    return User.countDocuments({
      role: "agent",
      status: "active",
    });
  }

  async getPendingInspections() {
    return Inspection.countDocuments({
      status: "pending",
    });
  }

  async getInventoryDevices() {
    return Inventory.countDocuments({
      status: {
        $in: ["draft", "listed"],
      },
    });
  }

  async getOrdersForToday(startOfDay, endOfDay) {
    return Order.countDocuments({
      "pickup.scheduledDate": {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });
  }

  // ORDER PIPELINE

  async getOrderPipeline() {
    const result = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const pipeline = {
      newOrders: 0,
      scheduled: 0,
      pickedUp: 0,
      inspected: 0,
      inTransit: 0,
      readyStock: 0,
    };

    for (const item of result) {
      switch (item._id) {
        case "pending":
          pipeline.newOrders += item.count;
          break;

        case "pickup_scheduled":
        case "assigned":
          pipeline.scheduled += item.count;
          break;

        case "picked_up":
          pipeline.pickedUp += item.count;
          break;

        case "inspection_pending":
        case "inspection_in_progress":
        case "inspection_completed":
        case "approved":
          pipeline.inspected += item.count;
          break;

        case "in_transit":
          pipeline.inTransit += item.count;
          break;

        case "ready_stock":
          pipeline.readyStock += item.count;
          break;

        default:
          break;
      }
    }

    return pipeline;
  }

  // RECENT ORDERS

  async getRecentOrders(limit = 10) {
    return Order.find({})
      .populate("customer", "fullName phone")
      .populate(
        "agent",
        "fullName phone agentProfile.agentId"
      )
      .populate(
        "device",
        "brand model variant storage ram valuationPrice"
      )
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  // PENDING PAYMENTS

  async getPendingPayments(limit = 10) {
    return Order.find({
      "payment.status": {
        $in: ["pending", "processing"],
      },
      status: "payment_pending",
    })
      .populate("customer", "fullName phone")
      .populate(
        "device",
        "brand model variant storage ram"
      )
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  // ORDER REPORT

  async getOrderReport(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
    } = options;

    const safePage = Math.max(
      Number(page) || 1,
      1
    );

    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (safePage - 1) * safeLimit;

    const [orders, total] =
      await Promise.all([
        Order.find(filter)
          .populate(
            "customer",
            "fullName phone email"
          )
          .populate(
            "agent",
            "fullName phone agentProfile.agentId"
          )
          .populate(
            "device",
            "brand model variant storage ram"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(safeLimit)
          .lean(),

        Order.countDocuments(filter),
      ]);

    return {
      orders,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(
        total / safeLimit
      ),
    };
  }

  // REVENUE / PAYMENT SUMMARY

  async getPaymentSummary(match = {}) {
    const result = await Order.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: null,

          totalEstimatedAmount: {
            $sum: {
              $ifNull: [
                "$payment.estimatedAmount",
                0,
              ],
            },
          },

          totalFinalAmount: {
            $sum: {
              $ifNull: [
                "$payment.finalAmount",
                0,
              ],
            },
          },

          completedPaymentAmount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$payment.status",
                    "completed",
                  ],
                },
                {
                  $ifNull: [
                    "$payment.finalAmount",
                    0,
                  ],
                },
                0,
              ],
            },
          },

          completedPayments: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$payment.status",
                    "completed",
                  ],
                },
                1,
                0,
              ],
            },
          },

          pendingPaymentAmount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$payment.status",
                    [
                      "pending",
                      "processing",
                    ],
                  ],
                },
                {
                  $ifNull: [
                    "$payment.estimatedAmount",
                    0,
                  ],
                },
                0,
              ],
            },
          },

          pendingPayments: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$payment.status",
                    [
                      "pending",
                      "processing",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return (
      result[0] || {
        totalEstimatedAmount: 0,
        totalFinalAmount: 0,
        completedPaymentAmount: 0,
        completedPayments: 0,
        pendingPaymentAmount: 0,
        pendingPayments: 0,
      }
    );
  }

  // INVENTORY / SALES SUMMARY

  async getInventorySummary() {
    const result =
      await Inventory.aggregate([
        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },

            purchaseAmount: {
              $sum: {
                $ifNull: [
                  "$purchasePrice",
                  0,
                ],
              },
            },

            listedAmount: {
              $sum: {
                $ifNull: [
                  "$listedPrice",
                  0,
                ],
              },
            },

            soldAmount: {
              $sum: {
                $ifNull: [
                  "$soldPrice",
                  0,
                ],
              },
            },
          },
        },
      ]);

    return result;
  }

  // AGENT EARNINGS SUMMARY

  async getAgentEarningSummary() {
    const result =
      await AgentEarning.aggregate([
        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },

            amount: {
              $sum: {
                $ifNull: [
                  "$amount",
                  0,
                ],
              },
            },
          },
        },
      ]);

    return result;
  }

  // DEVICE REPORT

  async getDeviceReport() {
    return Device.aggregate([
      {
        $group: {
          _id: {
            brand: "$brand",
            model: "$model",
          },

          count: {
            $sum: 1,
          },

          totalValuation: {
            $sum: {
              $ifNull: [
                "$valuationPrice",
                0,
              ],
            },
          },

          totalPurchasePrice: {
            $sum: {
              $ifNull: [
                "$purchasePrice",
                0,
              ],
            },
          },

          totalExpectedSellingPrice: {
            $sum: {
              $ifNull: [
                "$expectedSellingPrice",
                0,
              ],
            },
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]);
  }
}

export default new ReportRepository();