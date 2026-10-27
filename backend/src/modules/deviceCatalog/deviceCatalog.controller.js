import asyncHandler from "../../utils/api/asyncHandler.js";
import ApiResponse from "../../utils/response/ApiResponse.js";

import {
  createDeviceCatalog,
  getActiveDeviceCatalog,
  getAllDeviceCatalog,
  getDeviceCatalogById,
  findMatchingDeviceCatalog,
  updateDeviceCatalog,
  deleteDeviceCatalog,
  getDeviceCatalogEvaluation,
  getDefaultDeviceCatalogEvaluation,
} from "./deviceCatalog.service.js";

// CREATE

export const createDeviceCatalogController =
  asyncHandler(async (req, res) => {
    const catalog =
      await createDeviceCatalog(
        req.body,
        req.user.userId
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        catalog,
        "Device catalog created successfully."
      )
    );
  });

// GET ACTIVE CATALOG

export const getActiveDeviceCatalogController =
  asyncHandler(async (req, res) => {
    const catalogs =
      await getActiveDeviceCatalog();

    return res.status(200).json(
      new ApiResponse(
        200,
        catalogs,
        "Device catalog fetched successfully."
      )
    );
  });

// GET ALL CATALOG

export const getAllDeviceCatalogController =
  asyncHandler(async (req, res) => {
    const catalogs =
      await getAllDeviceCatalog();

    return res.status(200).json(
      new ApiResponse(
        200,
        catalogs,
        "All device catalog fetched successfully."
      )
    );
  });

// GET BY ID

export const getDeviceCatalogByIdController =
  asyncHandler(async (req, res) => {
    const catalog =
      await getDeviceCatalogById(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        catalog,
        "Device catalog fetched successfully."
      )
    );
  });

// FIND MATCHING DEVICE

export const findMatchingDeviceCatalogController =
  asyncHandler(async (req, res) => {
    const catalog =
      await findMatchingDeviceCatalog(
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        catalog,
        "Matching device catalog fetched successfully."
      )
    );
  });

// UPDATE

export const updateDeviceCatalogController =
  asyncHandler(async (req, res) => {
    const catalog =
      await updateDeviceCatalog(
        req.params.id,
        req.body,
        req.user.userId
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        catalog,
        "Device catalog updated successfully."
      )
    );
  });

// DELETE

export const deleteDeviceCatalogController =
  asyncHandler(async (req, res) => {
    await deleteDeviceCatalog(
      req.params.id
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Device catalog deleted successfully."
      )
    );
  });

  // GET DEFAULT EVALUATION CONFIGURATION

export const getDefaultDeviceCatalogEvaluationController =
  asyncHandler(async (req, res) => {
    const evaluation =
      await getDefaultDeviceCatalogEvaluation();

    return res.status(200).json(
      new ApiResponse(
        200,
        evaluation,
        "Default device evaluation configuration fetched successfully."
      )
    );
  });

export const getDeviceCatalogEvaluationController =
  asyncHandler(async (req, res) => {
    const evaluation =
      await getDeviceCatalogEvaluation(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        evaluation,
        "Device evaluation configuration fetched successfully."
      )
    );
  });