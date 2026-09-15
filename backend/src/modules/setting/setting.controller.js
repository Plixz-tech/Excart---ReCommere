import asyncHandler from "../../utils/api/asyncHandler.js";

import settingService from "./setting.service.js";

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings(
    req.user.userId
  );

  return res.status(200).json({
    success: true,
    message: "Account settings fetched successfully.",
    data: settings,
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(
    req.user.userId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Account settings updated successfully.",
    data: settings,
  });
});