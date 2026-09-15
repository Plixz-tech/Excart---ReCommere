import express from "express";
import reportController from "./report.controller.js";
import { orderReportQuerySchema } from "./report.validator.js";
import validateQuery from "../../middlewares/validation/validateQuery.js";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

// ADMIN REPORT ROUTES

router.get(
  "/dashboard",
  reportController.getDashboard
);

router.get(
  "/orders",
  validateQuery(orderReportQuerySchema),
  reportController.getOrderReport
);

router.get(
  "/payments",
  reportController.getPaymentReport
);

router.get(
  "/inventory",
  reportController.getInventoryReport
);

router.get(
  "/agent-earnings",
  reportController.getAgentEarningReport
);

router.get(
  "/devices",
  reportController.getDeviceReport
);

export default router;