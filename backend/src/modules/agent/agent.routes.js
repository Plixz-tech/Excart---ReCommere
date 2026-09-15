import { Router } from "express";

import * as agentController from "./agent.controller.js";

import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

import validateRequest from "../../middlewares/validation/validateRequest.js";
import validateParams from "../../middlewares/validation/validateParams.js";

import {
  agentIdSchema,
  createAgentSchema,
  updateAgentSchema,
  updateAgentStatusSchema,
  sendAadhaarOtpSchema,
  verifyAadhaarOtpSchema,
  verifyPanSchema,
} from "./agent.validator.js";

import upload from "../../middlewares/upload.js";

const router = Router();


/*
 * CREATE AGENT
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(createAgentSchema),
  agentController.createAgent
);


/*
 * GET ALL AGENTS
 */
router.get(
  "/",
  protect,
  authorize("admin"),
  agentController.getAgents
);


/*
 * GET AGENT BY ID
 */
router.get(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  agentController.getAgentById
);


/*
 * UPDATE AGENT
 */
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  validateRequest(updateAgentSchema),
  agentController.updateAgent
);


/*
 * UPDATE AGENT STATUS
 */
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  validateRequest(updateAgentStatusSchema),
  agentController.updateAgentStatus
);


/*
 * UPLOAD AGENT DOCUMENTS
 */
router.post(
  "/:id/documents",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  upload.fields([
    {
      name: "aadhaar",
      maxCount: 1,
    },
    {
      name: "panCard",
      maxCount: 1,
    },
    {
      name: "drivingLicense",
      maxCount: 1,
    },
    {
      name: "policeClearance",
      maxCount: 1,
    },
    {
      name: "photo",
      maxCount: 1,
    },
  ]),
  agentController.uploadDocuments
);


/*
 * SEND AADHAAR OTP
 */
router.post(
  "/:id/aadhaar/send-otp",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  validateRequest(sendAadhaarOtpSchema),
  agentController.sendAgentAadhaarOtp
);


/*
 * VERIFY AADHAAR OTP
 */
router.post(
  "/:id/aadhaar/verify-otp",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  validateRequest(verifyAadhaarOtpSchema),
  agentController.verifyAgentAadhaarOtp
);


/*
 * VERIFY PAN
 */
router.post(
  "/:id/verify-pan",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  validateRequest(verifyPanSchema),
  agentController.verifyAgentPan
);


/*
 * DELETE AGENT
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateParams(agentIdSchema),
  agentController.deleteAgent
);


export default router;