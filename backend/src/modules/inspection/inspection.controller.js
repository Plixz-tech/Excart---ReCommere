import * as inspectionService from "./inspection.service.js";
import asyncHandler from "../../utils/api/asyncHandler.js";
import ApiResponse from "../../utils/response/ApiResponse.js";

export const createInspection = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.createInspection(
    req.body,
    req.user.userId
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        inspection,
        "Inspection created successfully."
      )
    );
});

export const getInspections = asyncHandler(async (req, res) => {
  const inspections = await inspectionService.getInspections(
    req.query
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        inspections,
        "Inspections fetched successfully."
      )
    );
});

export const getInspectionById = asyncHandler(async (req, res) => {
  const inspection =
    await inspectionService.getInspectionById(
      req.params.id
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        inspection,
        "Inspection fetched successfully."
      )
    );
});

export const updateInspection = asyncHandler(async (req, res) => {
  const inspection =
    await inspectionService.updateInspection(
      req.params.id,
      req.body,
      req.user.userId
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        inspection,
        "Inspection updated successfully."
      )
    );
});

export const updateInspectionStatus = asyncHandler(
  async (req, res) => {
    const inspection =
      await inspectionService.updateInspectionStatus(
        req.params.id,
        req.body.status,
        req.user.userId
      );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          inspection,
          "Inspection status updated successfully."
        )
      );
  }
);