import * as userService from "./user.service.js";

export const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers(req.query);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const result = await userService.getUserById(req.params.id);

    res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const result = await userService.updateUser(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const result = await userService.updateUserStatus(
      req.params.id,
      req.body.status
    );

    res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};