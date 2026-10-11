import mongoose from "mongoose";

import ApiError from "../../utils/errors/ApiError.js";

import auditRepository from "./audit.repository.js";

class AuditService {
  async createLog(data) {
    const {
      actor,
      action,
      module,
      entityType,
      entityId = null,
      description,
      oldValue = null,
      newValue = null,
      metadata = {},
      ipAddress = "",
      userAgent = "",
    } = data;

    if (!actor) {
      throw new ApiError(
        400,
        "Audit actor is required."
      );
    }

    if (!mongoose.isValidObjectId(actor)) {
      throw new ApiError(
        400,
        "Invalid audit actor ID."
      );
    }

    if (!action?.trim()) {
      throw new ApiError(
        400,
        "Audit action is required."
      );
    }

    if (!module?.trim()) {
      throw new ApiError(
        400,
        "Audit module is required."
      );
    }

    if (!entityType?.trim()) {
      throw new ApiError(
        400,
        "Audit entity type is required."
      );
    }

    if (!description?.trim()) {
      throw new ApiError(
        400,
        "Audit description is required."
      );
    }

    if (
      entityId &&
      !mongoose.isValidObjectId(entityId)
    ) {
      throw new ApiError(
        400,
        "Invalid audit entity ID."
      );
    }

    return auditRepository.create({
      actor,
      action: action.trim(),
      module: module.trim(),
      entityType: entityType.trim(),
      entityId,
      description: description.trim(),
      oldValue,
      newValue,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  async createLogs(logs) {
    if (!Array.isArray(logs)) {
      throw new ApiError(
        400,
        "Audit logs must be an array."
      );
    }

    if (!logs.length) {
      return [];
    }

    const validatedLogs = logs.map((log) => {
      const {
        actor,
        action,
        module,
        entityType,
        entityId = null,
        description,
        oldValue = null,
        newValue = null,
        metadata = {},
        ipAddress = "",
        userAgent = "",
      } = log;

      if (!actor) {
        throw new ApiError(
          400,
          "Audit actor is required."
        );
      }

      if (!mongoose.isValidObjectId(actor)) {
        throw new ApiError(
          400,
          "Invalid audit actor ID."
        );
      }

      if (!action?.trim()) {
        throw new ApiError(
          400,
          "Audit action is required."
        );
      }

      if (!module?.trim()) {
        throw new ApiError(
          400,
          "Audit module is required."
        );
      }

      if (!entityType?.trim()) {
        throw new ApiError(
          400,
          "Audit entity type is required."
        );
      }

      if (!description?.trim()) {
        throw new ApiError(
          400,
          "Audit description is required."
        );
      }

      if (
        entityId &&
        !mongoose.isValidObjectId(entityId)
      ) {
        throw new ApiError(
          400,
          "Invalid audit entity ID."
        );
      }

      return {
        actor,
        action: action.trim(),
        module: module.trim(),
        entityType: entityType.trim(),
        entityId,
        description: description.trim(),
        oldValue,
        newValue,
        metadata,
        ipAddress,
        userAgent,
      };
    });

    return auditRepository.createMany(
      validatedLogs
    );
  }

  async getAuditById(id) {
    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(
        400,
        "Invalid audit log ID."
      );
    }

    const log =
      await auditRepository.findById(
        id
      );

    if (!log) {
      throw new ApiError(
        404,
        "Audit log not found."
      );
    }

    return log;
  }

  async getAuditLogs(query = {}) {
    const {
      page = 1,
      limit = 20,
      actor,
      module,
      action,
      entityType,
      entityId,
    } = query;

    const filter = {};

    if (actor) {
      if (!mongoose.isValidObjectId(actor)) {
        throw new ApiError(
          400,
          "Invalid actor ID."
        );
      }

      filter.actor =
        new mongoose.Types.ObjectId(
          actor
        );
    }

    if (module) {
      filter.module = module;
    }

    if (action) {
      filter.action = action;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (entityId) {
      if (
        !mongoose.isValidObjectId(
          entityId
        )
      ) {
        throw new ApiError(
          400,
          "Invalid entity ID."
        );
      }

      filter.entityId =
        new mongoose.Types.ObjectId(
          entityId
        );
    }

    return auditRepository.findAll(
      filter,
      {
        page: Number(page),
        limit: Number(limit),
      }
    );
  }

  async getEntityHistory(
    entityType,
    entityId
  ) {
    if (!entityType?.trim()) {
      throw new ApiError(
        400,
        "Entity type is required."
      );
    }

    if (
      !mongoose.isValidObjectId(
        entityId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid entity ID."
      );
    }

    return auditRepository.findByEntity(
      entityType.trim(),
      new mongoose.Types.ObjectId(
        entityId
      )
    );
  }

  async getActorHistory(
    actorId,
    query = {}
  ) {
    if (
      !mongoose.isValidObjectId(
        actorId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid actor ID."
      );
    }

    return auditRepository.findByActor(
      new mongoose.Types.ObjectId(
        actorId
      ),
      {
        page: Number(query.page),
        limit: Number(query.limit),
      }
    );
  }
}

export default new AuditService();