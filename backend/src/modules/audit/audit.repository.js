import AuditLog from "../../models/AuditLog.js";

class AuditRepository {
  async create(data) {
    return AuditLog.create(data);
  }

  async createMany(data) {
    return AuditLog.insertMany(data);
  }

  async findById(id) {
    return AuditLog.findById(id)
      .populate("actor", "fullName email phone role")
      .lean();
  }

  async findAll(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
    } = options;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate(
          "actor",
          "fullName email phone role"
        )
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findByEntity(entityType, entityId) {
    return AuditLog.find({
      entityType,
      entityId,
    })
      .populate(
        "actor",
        "fullName email phone role"
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByActor(actorId, options = {}) {
    return this.findAll(
      {
        actor: actorId,
      },
      options
    );
  }
}

export default new AuditRepository();