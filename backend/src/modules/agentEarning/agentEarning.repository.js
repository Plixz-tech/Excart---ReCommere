import AgentEarning from "../../models/AgentEarning.js";

class AgentEarningRepository {
  populateEarning(query) {
    return query
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "order",
        "orderNumber status payment pickup.scheduledDate pickup.scheduledTime"
      )
      .populate(
        "approvedBy",
        "fullName email"
      )
      .populate(
        "paidBy",
        "fullName email"
      );
  }

  async create(earningData) {
    return AgentEarning.create(
      earningData
    );
  }

  async findById(earningId) {
    return this.populateEarning(
      AgentEarning.findById(
        earningId
      )
    );
  }

  async findOne(filter = {}) {
    return this.populateEarning(
      AgentEarning.findOne(
        filter
      )
    );
  }

  async findAll(
    filter = {},
    options = {}
  ) {
    const {
      page = 1,
      limit = 10,
      sort = {
        createdAt: -1,
      },
    } = options;

    const safePage = Math.max(
      Number(page) || 1,
      1
    );

    const safeLimit = Math.min(
      Math.max(
        Number(limit) || 10,
        1
      ),
      100
    );

    const skip =
      (safePage - 1) *
      safeLimit;

    const earningsQuery =
      AgentEarning.find(
        filter
      )
        .sort(sort)
        .skip(skip)
        .limit(safeLimit);

    const earnings =
      await this.populateEarning(
        earningsQuery
      );

    const total =
      await AgentEarning.countDocuments(
        filter
      );

    return {
      earnings,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages:
        Math.ceil(
          total / safeLimit
        ),
    };
  }

  async updateById(
    earningId,
    updateData
  ) {
    const query =
      AgentEarning.findByIdAndUpdate(
        earningId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    return this.populateEarning(
      query
    );
  }

  async deleteById(
    earningId
  ) {
    return AgentEarning.findByIdAndDelete(
      earningId
    );
  }

  async count(
    filter = {}
  ) {
    return AgentEarning.countDocuments(
      filter
    );
  }

  async aggregate(
    pipeline = []
  ) {
    return AgentEarning.aggregate(
      pipeline
    );
  }
}

export default new AgentEarningRepository();