import * as userRepository from "./user.repository.js";

export const getUsers = async (query) => {
  return await userRepository.getUsers(query);
};

export const getUserById = async (userId) => {
  return await userRepository.getUserById(userId);
};

export const updateUser = async (userId, data) => {
  return await userRepository.updateUser(userId, data);
};

export const updateUserStatus = async (userId, status) => {
  return await userRepository.updateUserStatus(userId, status);
};

export const deleteUser = async (userId) => {
  return await userRepository.deleteUser(userId);
};