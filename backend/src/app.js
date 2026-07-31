import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import userRoutes from "./modules/user/user.routes.js"
import agentRoutes from "./modules/agent/agent.routes.js";

import notFound from "./middlewares/errors/notFound.js";
import errorHandler from "./middlewares/errors/errorHandler.js";
import deviceRoutes from "./modules/device/device.routes.js";

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

app.use((req, res, next) => {
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Body:", req.body);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
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

app.use(notFound);
app.use(errorHandler);

export default app;