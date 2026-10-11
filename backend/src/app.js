import express from "express";

import cors from "cors";

import helmet from "helmet";

import compression from "compression";

import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";

import adminRoutes from "./modules/admin/admin.routes.js";

import userRoutes from "./modules/user/user.routes.js";

import agentRoutes from "./modules/agent/agent.routes.js";

import deviceRoutes from "./modules/device/device.routes.js";

import addressRoutes from "./modules/address/address.routes.js";

import serviceAreaRoutes from "./modules/serviceArea/serviceArea.routes.js";

import orderRoutes from "./modules/order/order.routes.js";

import adminOrderRoutes from "./modules/order/adminOrder.routes.js";

import agentOrderRoutes from "./modules/order/agentOrder.routes.js";

import inspectionRoutes from "./modules/inspection/inspection.routes.js";

import inventoryRoutes from "./modules/inventory/inventory.routes.js";

import paymentRoutes from "./modules/payment/payment.routes.js";

import pricingRuleRoutes from "./modules/pricingRule/pricingRule.routes.js";

import notFound from "./middlewares/errors/notFound.js";

import errorHandler from "./middlewares/errors/errorHandler.js";

import payoutAccountRoutes from "./modules/payment/payoutAccount.routes.js";

import deviceCatalogRoutes from "./modules/deviceCatalog/deviceCatalog.routes.js";

import notificationRoutes from "./modules/notification/notification.routes.js";

import agentEarningRoutes from "./modules/agentEarning/agentEarning.routes.js";

import reportRoutes from "./modules/report/report.routes.js";

import agentTrackingRoutes from "./modules/agentTracking/agentTracking.routes.js";

import settingRoutes from "./modules/setting/setting.routes.js";

import auditRoutes from "./modules/audit/audit.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";

import faqRoutes from "./modules/faq/faq.routes.js";

import supportRoutes from "./modules/support/support.routes.js";

import issueRoutes from "./modules/issue/issue.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "ExCart API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/admin/users", userRoutes);

app.use("/api/v1/admin/agents", agentRoutes);

app.use("/api/v1/devices", deviceRoutes);

app.use("/api/v1/device-catalog", deviceCatalogRoutes);

app.use("/api/v1/addresses", addressRoutes);

app.use("/api/v1/service-areas", serviceAreaRoutes);

app.use("/api/v1/orders", orderRoutes);

app.use("/api/v1/admin/orders", adminOrderRoutes);

app.use("/api/v1/agent/orders", agentOrderRoutes);

app.use("/api/v1/admin/inspections", inspectionRoutes);

app.use("/api/v1/admin/inventory", inventoryRoutes);

app.use("/api/v1/admin/payments", paymentRoutes);

app.use("/api/v1/payout-accounts", payoutAccountRoutes);

app.use("/api/v1/pricing-rules", pricingRuleRoutes);

app.use("/api/v1/notifications", notificationRoutes);

app.use("/api/v1/settings", settingRoutes);

app.use("/api/v1/audit", auditRoutes);

app.use("/api/v1/agent-earnings", agentEarningRoutes);

app.use("/api/v1/agent-tracking", agentTrackingRoutes);

app.use("/api/v1/admin/reports", reportRoutes);

app.use("/api/v1/reviews", reviewRoutes);

app.use("/api/v1/faqs", faqRoutes);

app.use("/api/v1/support", supportRoutes);

app.use("/api/v1/issues", issueRoutes);


app.use(notFound);

app.use(errorHandler);

export default app;