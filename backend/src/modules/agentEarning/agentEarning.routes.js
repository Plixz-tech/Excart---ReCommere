import express from "express";

import agentEarningController from "./agentEarning.controller.js";

import {
  earningIdSchema,
  earningListSchema,
  payEarningSchema,
  cancelEarningSchema,
} from "./agentEarning.validator.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";
import validateQuery from "../../middlewares/validation/validateQuery.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

router.use(protect);

// AGENT EARNING ROUTES

// Get my earnings
router.get(
  "/",
  validateQuery(earningListSchema),
  agentEarningController.getMyEarnings
);

// Get my earning summary
router.get(
  "/summary",
  agentEarningController.getMyEarningSummary
);

// ADMIN EARNING ROUTES

// Get all agent earnings
router.get(
  "/admin/all",
  authorize("admin"),
  validateQuery(earningListSchema),
  agentEarningController.getAllEarnings
);

// Get overall earning summary
router.get(
  "/admin/summary",
  authorize("admin"),
  validateQuery(earningListSchema),
  agentEarningController.getEarningSummary
);

// Get any earning by ID
router.get(
  "/admin/:id",
  authorize("admin"),
  validateParams(earningIdSchema),
  agentEarningController.getEarningById
);

// Approve earning
router.patch(
  "/admin/:id/approve",
  authorize("admin"),
  validateParams(earningIdSchema),
  agentEarningController.approveEarning
);

// Mark earning as paid
router.patch(
  "/admin/:id/pay",
  authorize("admin"),
  validateParams(earningIdSchema),
  validateRequest(payEarningSchema),
  agentEarningController.markEarningAsPaid
);

// Cancel earning
router.patch(
  "/admin/:id/cancel",
  authorize("admin"),
  validateParams(earningIdSchema),
  validateRequest(cancelEarningSchema),
  agentEarningController.cancelEarning
);

// Get my earning by ID
router.get(
  "/:id",
  validateParams(earningIdSchema),
  agentEarningController.getMyEarningById
);

export default router;