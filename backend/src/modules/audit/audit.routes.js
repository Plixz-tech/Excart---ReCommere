import express from "express";

import * as auditController from "./audit.controller.js";

import {
  auditIdSchema,
  auditEntitySchema,
  auditActorSchema,
  auditListSchema,
} from "./audit.validator.js";

import validateParams from "../../middlewares/validation/validateParams.js";
import validateQuery from "../../middlewares/validation/validateQuery.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get(
  "/",
  validateQuery(auditListSchema),
  auditController.getAuditLogs
);

router.get(
  "/entity/:entityType/:entityId",
  validateParams(auditEntitySchema),
  auditController.getEntityHistory
);

router.get(
  "/actor/:actorId",
  validateParams(auditActorSchema),
  validateQuery(auditListSchema.pick({
    page: true,
    limit: true,
  })),
  auditController.getActorHistory
);

router.get(
  "/:id",
  validateParams(auditIdSchema),
  auditController.getAuditById
);

export default router;