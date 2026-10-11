import { Router } from "express";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import supportController from "./support.controller.js";

const router = Router();

router.get(
  "/call",
  protect,
  authorize("user", "agent", "admin"),
  supportController.getCallSupport
);

router.get(
  "/whatsapp",
  protect,
  authorize("user", "agent", "admin"),
  supportController.getWhatsAppSupport
);

export default router;