import AgentLocation from "../../models/AgentLocation.js";

class AgentTrackingRepository {
  async create(locationData) {
    return AgentLocation.create(locationData);
  }

  async findByAgent(agentId) {
    return AgentLocation.findOne({
      agent: agentId,
    })
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "order",
        "orderNumber status pickup.status pickup.scheduledDate pickup.scheduledTime"
      );
  }

  async findByOrder(orderId) {
    return AgentLocation.findOne({
      order: orderId,
    })
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "order",
        "orderNumber status pickup.status pickup.scheduledDate pickup.scheduledTime"
      );
  }

  async upsertByAgent(agentId, locationData) {
    return AgentLocation.findOneAndUpdate(
      { agent: agentId },
      {
        $set: {
          ...locationData,
          lastUpdatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    )
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "order",
        "orderNumber status pickup.status pickup.scheduledDate pickup.scheduledTime"
      );
  }

  async updateByAgent(agentId, updateData) {
    return AgentLocation.findOneAndUpdate(
      { agent: agentId },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "order",
        "orderNumber status pickup.status pickup.scheduledDate pickup.scheduledTime"
      );
  }

  async deleteByAgent(agentId) {
    return AgentLocation.findOneAndDelete({
      agent: agentId,
    });
  }

  async findAll(filter = {}) {
    return AgentLocation.find(filter)
      .populate(
        "agent",
        "fullName phone email agentProfile.agentId"
      )
      .populate(
        "order",
        "orderNumber status pickup.status pickup.scheduledDate pickup.scheduledTime"
      )
      .sort({
        lastUpdatedAt: -1,
      });
  }
}

export default new AgentTrackingRepository();