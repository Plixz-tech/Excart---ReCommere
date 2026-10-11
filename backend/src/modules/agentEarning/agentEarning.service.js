import mongoose from "mongoose";

import agentEarningRepository from "./agentEarning.repository.js";

import {
  getPayoutAccount,
  registerCashfreeBeneficiary,
} from "../payment/payoutAccount.service.js";

import {
  createTransfer,
} from "../../lib/cashfreePayout.js";

class AgentEarningService {
  // AGENT - GET OWN EARNINGS

  async getMyEarnings(
    agentId,
    query = {}
  ) {
    const {
      page = 1,
      limit = 10,
      status,
    } = query;

    const filter = {
      agent: agentId,
    };

    if (status) {
      filter.status = status;
    }

    return agentEarningRepository.findAll(
      filter,
      {
        page: Number(page),
        limit: Number(limit),
      }
    );
  }

  // AGENT - GET OWN EARNING BY ID

  async getMyEarningById(
    earningId,
    agentId
  ) {
    const earning =
      await agentEarningRepository.findById(
        earningId
      );

    if (!earning) {
      const error = new Error(
        "Earning not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      !earning.agent ||
      earning.agent._id.toString() !==
        agentId.toString()
    ) {
      const error = new Error(
        "You are not authorized to view this earning."
      );

      error.statusCode = 403;

      throw error;
    }

    return earning;
  }

  // AGENT - GET OWN EARNING SUMMARY

  async getMyEarningSummary(
    agentId
  ) {
    const agentObjectId =
      new mongoose.Types.ObjectId(
        agentId
      );

    const result =
      await agentEarningRepository.aggregate([
        {
          $match: {
            agent: agentObjectId,
          },
        },
        {
          $group: {
            _id: "$status",
            totalAmount: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const summary = {
      pending: {
        amount: 0,
        count: 0,
      },

      approved: {
        amount: 0,
        count: 0,
      },

      paid: {
        amount: 0,
        count: 0,
      },

      cancelled: {
        amount: 0,
        count: 0,
      },
    };

    for (const item of result) {
      if (
        summary[item._id]
      ) {
        summary[item._id] = {
          amount:
            item.totalAmount || 0,

          count:
            item.count || 0,
        };
      }
    }

    const totalEarned =
      summary.approved.amount +
      summary.paid.amount;

    const totalPaid =
      summary.paid.amount;

    const totalPending =
      summary.pending.amount;

    return {
      totalEarned,
      totalPaid,
      totalPending,

      pending:
        summary.pending,

      approved:
        summary.approved,

      paid:
        summary.paid,

      cancelled:
        summary.cancelled,
    };
  }

  // ADMIN - GET ALL EARNINGS

  async getAllEarnings(
    query = {}
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      agent,
    } = query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (agent) {
      filter.agent = agent;
    }

    return agentEarningRepository.findAll(
      filter,
      {
        page: Number(page),
        limit: Number(limit),
      }
    );
  }

  // ADMIN - GET EARNING BY ID

  async getEarningById(
    earningId
  ) {
    const earning =
      await agentEarningRepository.findById(
        earningId
      );

    if (!earning) {
      const error = new Error(
        "Earning not found."
      );

      error.statusCode = 404;

      throw error;
    }

    return earning;
  }

  // ADMIN - APPROVE EARNING

  async approveEarning(
    earningId,
    adminId
  ) {
    const earning =
      await agentEarningRepository.findById(
        earningId
      );

    if (!earning) {
      const error = new Error(
        "Earning not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      earning.status !==
      "pending"
    ) {
      const error = new Error(
        `Only pending earnings can be approved. Current status is "${earning.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    return agentEarningRepository.updateById(
      earningId,
      {
        status:
          "approved",

        approvedAt:
          new Date(),

        approvedBy:
          adminId,
      }
    );
  }

  // ADMIN - MARK EARNING AS PAID
// ADMIN - MARK EARNING AS PAID

async markEarningAsPaid(
  earningId,
  adminId,
  data = {}
) {
  const earning =
    await agentEarningRepository.findById(
      earningId
    );

  if (!earning) {
    const error = new Error(
      "Earning not found."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    earning.status !==
    "approved"
  ) {
    const error = new Error(
      `Only approved earnings can be paid. Current status is "${earning.status}".`
    );

    error.statusCode = 400;

    throw error;
  }

  // Get agent payout account
  const agentId =
    earning.agent?._id?.toString();

  if (!agentId) {
    const error = new Error(
      "Agent information is missing for this earning."
    );

    error.statusCode = 400;

    throw error;
  }

  const payoutAccount =
    await getPayoutAccount(
      agentId
    );

  if (!payoutAccount) {
    const error = new Error(
      "Agent payout account not found."
    );

    error.statusCode = 400;

    throw error;
  }

  // Payout account must be verified
  if (!payoutAccount.isVerified) {
    const error = new Error(
      "Agent payout account must be verified before payment."
    );

    error.statusCode = 400;

    throw error;
  }

  // Make sure Cashfree beneficiary exists
  let beneficiaryId =
    payoutAccount.cashfreeBeneficiaryId;

  if (
    payoutAccount.cashfreeBeneficiaryStatus !==
      "created" ||
    !beneficiaryId
  ) {
    const beneficiaryResult =
      await registerCashfreeBeneficiary({
        payoutAccountId:
          payoutAccount._id,
        userId: agentId,
      });

    beneficiaryId =
      beneficiaryResult?.payoutAccount
        ?.cashfreeBeneficiaryId ||
      beneficiaryResult?.cashfreeBeneficiaryId ||
      "";

    if (!beneficiaryId) {
      const error = new Error(
        "Cashfree beneficiary registration failed."
      );

      error.statusCode = 400;

      throw error;
    }
  }

  // Generate a unique transfer ID
  const transferId =
    `AGENT-${earning._id.toString()}-${Date.now()}`;

  // Initiate Cashfree payout
  let cashfreeResponse;

  try {
    cashfreeResponse =
      await createTransfer({
        transferId,
        amount: earning.amount,
        beneficiaryId,
        transferMode:
          payoutAccount.type === "upi"
            ? "upi"
            : "banktransfer",
        remarks:
          `Agent commission for order ${earning.order?.orderNumber || earning.order?._id}`,
      });
  } catch (error) {
    await agentEarningRepository.updateById(
      earningId,
      {
        payout: {
          provider: "cashfree",
          beneficiaryId,
          transferId,
          referenceId: "",
          status: "failed",
          initiatedAt: new Date(),
          completedAt: null,
          failureReason:
            error?.message ||
            "Cashfree payout failed.",
        },
      }
    );

    throw error;
  }

  const referenceId =
    cashfreeResponse?.data
      ?.reference_id ||
    cashfreeResponse?.reference_id ||
    "";

  // Cashfree accepted the transfer
  const payoutStatus =
    cashfreeResponse?.data
      ?.status ||
    cashfreeResponse?.status ||
    "pending";

  return agentEarningRepository.updateById(
    earningId,
    {
      status:
        payoutStatus === "SUCCESS"
          ? "paid"
          : "approved",

      payout: {
        provider: "cashfree",
        beneficiaryId,
        transferId,
        referenceId,
        status:
          payoutStatus === "SUCCESS"
            ? "success"
            : "pending",
        initiatedAt:
          new Date(),
        completedAt:
          payoutStatus === "SUCCESS"
            ? new Date()
            : null,
        failureReason: "",
      },

      ...(payoutStatus ===
        "SUCCESS"
        ? {
            paidAt:
              new Date(),
            paidBy:
              adminId,
            paymentReference:
              referenceId ||
              transferId,
          }
        : {}),
    }
  );
}
  // ADMIN - CANCEL EARNING

  async cancelEarning(
    earningId,
    adminId,
    notes = ""
  ) {
    const earning =
      await agentEarningRepository.findById(
        earningId
      );

    if (!earning) {
      const error = new Error(
        "Earning not found."
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      [
        "paid",
        "cancelled",
      ].includes(
        earning.status
      )
    ) {
      const error = new Error(
        `Earning cannot be cancelled because its current status is "${earning.status}".`
      );

      error.statusCode = 400;

      throw error;
    }

    return agentEarningRepository.updateById(
      earningId,
      {
        status:
          "cancelled",

        notes:
          notes?.trim() || "",

        updatedAt:
          new Date(),
      }
    );
  }

  // ADMIN - GET EARNING SUMMARY

  async getEarningSummary(
    query = {}
  ) {
    const {
      agent,
    } = query;

    const match = {};

    if (agent) {
      match.agent =
        new mongoose.Types.ObjectId(
          agent
        );
    }

    const result =
      await agentEarningRepository.aggregate([
        {
          $match:
            match,
        },
        {
          $group: {
            _id: "$status",

            totalAmount: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const summary = {
      pending: {
        amount: 0,
        count: 0,
      },

      approved: {
        amount: 0,
        count: 0,
      },

      paid: {
        amount: 0,
        count: 0,
      },

      cancelled: {
        amount: 0,
        count: 0,
      },
    };

    for (const item of result) {
      if (
        summary[item._id]
      ) {
        summary[item._id] = {
          amount:
            item.totalAmount || 0,

          count:
            item.count || 0,
        };
      }
    }

    return {
      pending:
        summary.pending,

      approved:
        summary.approved,

      paid:
        summary.paid,

      cancelled:
        summary.cancelled,

      totalRecords:
        summary.pending.count +
        summary.approved.count +
        summary.paid.count +
        summary.cancelled.count,

      totalAmount:
        summary.pending.amount +
        summary.approved.amount +
        summary.paid.amount,

      totalPaid:
        summary.paid.amount,
    };
  }
}

export default new AgentEarningService();