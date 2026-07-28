import * as adminService from "./admin.service.js";

export const login = async (req, res, next) => {
  try {
    const result = await adminService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Admin logged in successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const admin = await adminService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const admin = await adminService.updateProfile(
      req.user.userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await adminService.changePassword(
      req.user.userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await adminService.logout(req.body.refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};


export const logoutAll = async (req, res, next) => {
  try {
    await adminService.logoutAll(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully.",
    });
  } catch (error) {
    next(error);
  }
};