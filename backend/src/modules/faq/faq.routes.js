import { Router } from "express";
import protect from "../../middlewares/auth/protect.js";
import authorize from "../../middlewares/auth/authorize.js";
import faqController from "./faq.controller.js";

const router = Router();

// Public/User — View FAQs
router.get(
  "/",
  protect,
  authorize("user", "agent", "admin"),
  faqController.getAllFAQs
);

// Admin — Create FAQ
router.post(
  "/",
  protect,
  authorize("admin"),
  faqController.createFAQ
);

// Admin/User — Get single FAQ
router.get(
  "/:faqId",
  protect,
  authorize("user", "agent", "admin"),
  faqController.getFAQById
);

// Admin — Update FAQ
router.patch(
  "/:faqId",
  protect,
  authorize("admin"),
  faqController.updateFAQ
);

// Admin — Delete FAQ
router.delete(
  "/:faqId",
  protect,
  authorize("admin"),
  faqController.deleteFAQ
);

export default router;