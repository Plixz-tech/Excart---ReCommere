import auditService from "../../modules/audit/audit.service.js";

const auditLogger = async ({
  actor,
  action,
  module,
  entityType,
  entityId = null,
  description,
  oldValue = null,
  newValue = null,
  metadata = {},
  req = null,
}) => {
  try {
    await auditService.createLog({
      actor,
      action,
      module,
      entityType,
      entityId,
      description,
      oldValue,
      newValue,
      metadata,
      ipAddress:
        req?.ip ||
        req?.headers?.["x-forwarded-for"] ||
        "",
      userAgent:
        req?.headers?.["user-agent"] ||
        "",
    });
  } catch (error) {
    console.error(
      "Failed to create audit log:",
      error
    );
  }
};

export default auditLogger;