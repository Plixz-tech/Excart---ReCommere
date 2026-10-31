
import express from "express";

import * as orderEvaluationController from "./orderEvaluation.controller.js";

import optionalProtect from "../../middlewares/auth/optionalProtect.js";
import protect from "../../middlewares/auth/protect.js";

import upload from "../../middlewares/upload.js";

const router = express.Router();

// CREATE EVALUATION — GUEST OR LOGGED-IN CUSTOMER
router.post(
  "/",
  optionalProtect,
  orderEvaluationController.createEvaluation
);

// GET EVALUATION — GUEST OR LOGGED-IN CUSTOMER
router.get(
  "/:evaluationId",
  optionalProtect,
  orderEvaluationController.getEvaluation
);

// SAVE EVALUATION ANSWERS — GUEST OR LOGGED-IN CUSTOMER
router.patch(
  "/:evaluationId/answers",
  optionalProtect,
  orderEvaluationController.saveEvaluationAnswers
);

// CALCULATE PRICE — GUEST OR LOGGED-IN CUSTOMER
router.post(
  "/:evaluationId/calculate-price",
  optionalProtect,
  orderEvaluationController.calculateEvaluationPrice
);

// SAVE IMEI — GUEST OR LOGGED-IN CUSTOMER
router.patch(
  "/:evaluationId/imei",
  optionalProtect,
  orderEvaluationController.saveEvaluationImei
);

// UPLOAD PHOTOS — GUEST OR LOGGED-IN CUSTOMER
router.post(
  "/:evaluationId/photos",
  optionalProtect,
  upload.array("photos", 6),
  orderEvaluationController.uploadEvaluationPhotos
);

// CONFIRM EVALUATION — AUTHENTICATED CUSTOMER ONLY
router.post(
  "/:evaluationId/confirm",
  protect,
  orderEvaluationController.confirmEvaluation
);

export default router;
