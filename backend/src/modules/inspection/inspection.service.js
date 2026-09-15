import * as inspectionRepository from "./inspection.repository.js";

export const createInspection = async (
  inspectionData,
  userId
) => {
  return await inspectionRepository.createInspection(
    inspectionData,
    userId
  );
};

export const getInspections = async (
  queryParams
) => {
  return await inspectionRepository.getInspections(
    queryParams
  );
};

export const getPendingInspections = async (
  queryParams
) => {
  return await inspectionRepository.getPendingInspections(
    queryParams
  );
};

export const getInspectionById = async (
  inspectionId
) => {
  return await inspectionRepository.getInspectionById(
    inspectionId
  );
};

export const updateInspection = async (
  inspectionId,
  inspectionData,
  userId
) => {
  return await inspectionRepository.updateInspection(
    inspectionId,
    inspectionData,
    userId
  );
};

export const completeInspection = async (
  inspectionId,
  userId
) => {
  return await inspectionRepository.completeInspection(
    inspectionId,
    userId
  );
};

export const updateInspectionStatus = async (
  inspectionId,
  status,
  reason,
  userId
) => {
  return await inspectionRepository.updateInspectionStatus(
    inspectionId,
    status,
    reason,
    userId
  );
};

export const deleteInspection = async (
  inspectionId
) => {
  return await inspectionRepository.deleteInspection(
    inspectionId
  );
};