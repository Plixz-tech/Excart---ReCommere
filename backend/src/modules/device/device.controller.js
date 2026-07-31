import * as deviceService from "./device.service.js";
import asyncHandler from "../../utils/api/asyncHandler.js";
import ApiResponse from "../../utils/response/ApiResponse.js";

export const createDevice = asyncHandler(async (req, res) => {
  const device = await deviceService.createDevice(
    req.body,
    req.user.userId
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, device, "Device created successfully.")
    );
});

export const getDevices = asyncHandler(async (req, res) => {
  const devices = await deviceService.getDevices(req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, devices, "Devices fetched successfully.")
    );
});

export const getDeviceById = asyncHandler(async (req, res) => {
  const device = await deviceService.getDeviceById(req.params.id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, device, "Device fetched successfully.")
    );
});

export const updateDevice = asyncHandler(async (req, res) => {
  const device = await deviceService.updateDevice(
    req.params.id,
    req.body,
    req.user.userId
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, device, "Device updated successfully.")
    );
});

export const updateDeviceStatus = asyncHandler(async (req, res) => {
  const device = await deviceService.updateDeviceStatus(
    req.params.id,
    req.body.status,
    req.user.userId
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        device,
        "Device status updated successfully."
      )
    );
});

export const deleteDevice = asyncHandler(async (req, res) => {
  await deviceService.deleteDevice(
    req.params.id,
    req.user.userId
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Device deleted successfully.")
    );
});