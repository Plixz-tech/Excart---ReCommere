import * as deviceRepository from "./device.repository.js";

export const createDevice = async (deviceData, adminId) => {
  return await deviceRepository.createDevice(deviceData, adminId);
};

export const getDevices = async (queryParams) => {
  return await deviceRepository.getDevices(queryParams);
};

export const getDeviceById = async (deviceId) => {
  return await deviceRepository.getDeviceById(deviceId);
};

export const updateDevice = async (
  deviceId,
  deviceData,
  adminId
) => {
  return await deviceRepository.updateDevice(
    deviceId,
    deviceData,
    adminId
  );
};

export const updateDeviceStatus = async (
  deviceId,
  status,
  adminId
) => {
  return await deviceRepository.updateDeviceStatus(
    deviceId,
    status,
    adminId
  );
};

export const deleteDevice = async (
  deviceId,
  adminId
) => {
  return await deviceRepository.deleteDevice(
    deviceId,
    adminId
  );
};