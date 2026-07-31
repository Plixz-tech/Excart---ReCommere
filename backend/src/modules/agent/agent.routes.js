import { Router } from "express";
import * as agentController from "./agent.controller.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import validateRequest from "../../middlewares/validation/validateRequest.js";
import {
  createAgentSchema,
  updateAgentSchema,
   updateAgentStatusSchema,
   verifyAadhaarSchema,
   verifyPanSchema,
} from "./agent.validator.js";
import upload from "../../middlewares/upload.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  validateRequest(createAgentSchema),
  agentController.createAgent
);

router.get(
  "/",
  protect,
  authorize("admin"),
  agentController.getAgents
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  agentController.getAgentById
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  validateRequest(updateAgentSchema),
  agentController.updateAgent
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  validateRequest(updateAgentStatusSchema),
  agentController.updateAgentStatus
);

router.post(
  "/:id/documents",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "policeClearance", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  agentController.uploadDocuments
);

router.post(
  "/:id/verify-aadhaar",
  protect,
  authorize("admin"),
  validateRequest(verifyAadhaarSchema),
  agentController.verifyAadhaar
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  agentController.deleteAgent
);


export default router;