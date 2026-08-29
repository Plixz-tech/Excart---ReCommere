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

export const updateInspectionStatus = async (
  inspectionId,
  status,
  userId
) => {
  return await inspectionRepository.updateInspectionStatus(
    inspectionId,
    status,
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