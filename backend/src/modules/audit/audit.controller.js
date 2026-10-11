import asyncHandler from "../../utils/api/asyncHandler.js";

import auditService from "./audit.service.js";

export const getAuditLogs = asyncHandler(
  async (req, res) => {
    const result =
      await auditService.getAuditLogs(req.query);

    return res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully.",
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }
);

export const getAuditById = asyncHandler(
  async (req, res) => {
    const log =
      await auditService.getAuditById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message: "Audit log fetched successfully.",
      data: log,
    });
  }
);

export const getEntityHistory = asyncHandler(
  async (req, res) => {
    const history =
      await auditService.getEntityHistory(
        req.params.entityType,
        req.params.entityId
      );

    return res.status(200).json({
      success: true,
      message: "Entity history fetched successfully.",
      data: history,
    });
  }
);

export const getActorHistory = asyncHandler(
  async (req, res) => {
    const history =
      await auditService.getActorHistory(
        req.params.actorId,
        req.query
      );

    return res.status(200).json({
      success: true,
      message: "Actor history fetched successfully.",
      data: history.logs,
      pagination: {
        total: history.total,
        page: history.page,
        limit: history.limit,
        totalPages: history.totalPages,
      },
    });
  }
);