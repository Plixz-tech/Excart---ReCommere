
import * as orderEvaluationService from "./orderEvaluation.service.js";

// CREATE EVALUATION

export const createEvaluation = async (req, res, next) => {
  try {
    const { deviceCatalogId } = req.body;

    // Customer ID is available only when authenticated.
    const customerId = req.user?.userId || null;

    const evaluation =
      await orderEvaluationService.createEvaluation(
        deviceCatalogId,
        customerId
      );

    return res.status(201).json({
      success: true,
      message: "Evaluation created successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// GET EVALUATION

export const getEvaluation = async (req, res, next) => {
  try {
    const evaluation =
      await orderEvaluationService.getEvaluation(
        req.params.evaluationId,
        req.user?.userId || null,
        req.headers["x-guest-token"] || null
      );

    return res.status(200).json({
      success: true,
      message: "Evaluation retrieved successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// SAVE EVALUATION ANSWERS

export const saveEvaluationAnswers = async (req, res, next) => {
  try {
    const { customerEvaluation } = req.body;

    const evaluation =
      await orderEvaluationService.saveEvaluationAnswers(
        req.params.evaluationId,
        req.user?.userId || null,
        customerEvaluation,
        req.headers["x-guest-token"] || null
      );

    return res.status(200).json({
      success: true,
      message: "Evaluation answers saved successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};


// CALCULATE EVALUATION PRICE

export const calculateEvaluationPrice = async (req, res, next) => {
  try {
    const evaluation =
      await orderEvaluationService.calculateEvaluationPrice(
        req.params.evaluationId,
        req.user?.userId || null,
        req.headers["x-guest-token"] || null
      );

    return res.status(200).json({
      success: true,
      message: "Evaluation price calculated successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};



// SAVE CUSTOMER DEVICE IMEI

export const saveEvaluationImei = async (req, res, next) => {
  try {
    const { imei1 } = req.body;

    const evaluation =
      await orderEvaluationService.saveEvaluationImei(
        req.params.evaluationId,
        req.user?.userId || null,
        imei1,
        req.headers["x-guest-token"] || null
      );

    return res.status(200).json({
      success: true,
      message: "Device IMEI saved successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};



// UPLOAD CUSTOMER DEVICE PHOTOS

export const uploadEvaluationPhotos = async (
  req,
  res,
  next
) => {
  try {
    const evaluation =
      await orderEvaluationService.uploadEvaluationPhotos(
        req.params.evaluationId,
        req.user?.userId || null,
        req.files,
        req.headers["x-guest-token"] || null
      );

    return res.status(200).json({
      success: true,
      message: "Device photos uploaded successfully.",
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// CONFIRM EVALUATION AND CREATE ORDER

export const confirmEvaluation = async (req, res, next) => {
  try {
    const customerId = req.user?.userId;

    if (!customerId) {
      const error = new Error(
        "Please log in to confirm your evaluation."
      );
      error.statusCode = 401;
      throw error;
    }

    const result =
      await orderEvaluationService.confirmEvaluation(
        req.params.evaluationId,
        customerId,
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Evaluation confirmed and order created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
