import * as serviceAreaService from "./serviceArea.service.js";

import asyncHandler from "../../utils/api/asyncHandler.js";

import ApiResponse from "../../utils/response/ApiResponse.js";

export const createServiceArea = asyncHandler(
  async (req, res) => {
    const serviceArea =
      await serviceAreaService.createServiceArea(
        req.body,
        req.user.userId
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        serviceArea,
        "Service area created successfully."
      )
    );
  }
);

export const getServiceAreas = asyncHandler(
  async (req, res) => {
    const serviceAreas =
      await serviceAreaService.getServiceAreas();

    return res.status(200).json(
      new ApiResponse(
        200,
        serviceAreas,
        "Service areas fetched successfully."
      )
    );
  }
);

export const getServiceAreaById = asyncHandler(
  async (req, res) => {
    const serviceArea =
      await serviceAreaService.getServiceAreaById(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        serviceArea,
        "Service area fetched successfully."
      )
    );
  }
);

export const updateServiceArea = asyncHandler(
  async (req, res) => {
    const serviceArea =
      await serviceAreaService.updateServiceArea(
        req.params.id,
        req.body,
        req.user.userId
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        serviceArea,
        "Service area updated successfully."
      )
    );
  }
);

export const deleteServiceArea = asyncHandler(
  async (req, res) => {
    await serviceAreaService.deleteServiceArea(
      req.params.id
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Service area deleted successfully."
      )
    );
  }
);


// below is for user

export const checkServiceability = asyncHandler(async (req, res) => {
  const result = await serviceAreaService.checkServiceability(
    req.params.pincode
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      result.pickupAvailable
        ? "Pickup is available in this area."
        : "Pickup is not available in this area."
    )
  );
});

export const checkLocationServiceability = asyncHandler(
  async (req, res) => {
    const result =
      await serviceAreaService.checkLocationServiceability(
        req.query.latitude,
        req.query.longitude
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        result.pickupAvailable
          ? "Pickup is available at this location."
          : "Pickup is not available at this location."
      )
    );
  }
);