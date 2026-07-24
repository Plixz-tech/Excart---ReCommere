import { Router } from "express";
import authRoutes from "../../modules/auth/auth.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to ExCart API v1",
  });
});

router.use("/auth", authRoutes);

export default router;