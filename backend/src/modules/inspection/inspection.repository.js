import mongoose from "mongoose";
import Inspection from "../../models/Inspection.js";
import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";

export const createInspection = async (
  inspectionData,
  userId
) => {
  // Validate Device ID
  if (!mongoose.Types.ObjectId.isValid(inspectionData.device)) {
    throw new ApiError(400, "Invalid device ID.");
  }

  // One inspection per device
  const existingInspection = await Inspection.findOne({
    device: inspectionData.device,
  });

  if (existingInspection) {
    throw new ApiError(
      409,
      "Inspection already exists for this device."
    );
  }

  const inspection = await Inspection.create({
    ...inspectionData,
    createdBy: userId,
  });

  return inspection;
};

export const getInspections = async (queryParams) => {
  const filter = {};

  const { page, limit, skip } = getPagination(queryParams);

  const {
    status,
    overallGrade,
    sortBy = "createdAt",
    order = "desc",
  } = queryParams;

  if (status) {
    filter.status = status;
  }

  if (overallGrade) {
    filter.overallGrade = overallGrade;
  }

  const allowedSortFields = [
    "batteryHealth",
    "estimatedPrice",
    "overallGrade",
    "status",
    "createdAt",
  ];

  const sortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const sort = {
    [sortField]: order === "asc" ? 1 : -1,
  };

  const inspections = await Inspection.find(filter)
    .populate("device")
    .populate("inspectionAgent", "fullName phone")
    .populate("createdBy", "fullName")
    .populate("updatedBy", "fullName")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalInspections =
    await Inspection.countDocuments(filter);

  return {
    inspections,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalInspections / limit),
      totalInspections,
      limit,
    },
  };
};

export const getInspectionById = async (
  inspectionId
) => {
  if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
    throw new ApiError(400, "Invalid inspection ID.");
  }

  const inspection = await Inspection.findById(
    inspectionId
  )
    .populate("device")
    .populate("inspectionAgent", "fullName phone email")
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email");

  if (!inspection) {
    throw new ApiError(404, "Inspection not found.");
  }

  return inspection;
};

export const updateInspection = async (
  inspectionId,
  inspectionData,
  userId
) => {
  if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
    throw new ApiError(400, "Invalid inspection ID.");
  }

  const inspection = await Inspection.findById(
    inspectionId
  );

  if (!inspection) {
    throw new ApiError(404, "Inspection not found.");
  }

  Object.keys(inspectionData).forEach((key) => {
    inspection[key] = inspectionData[key];
  });

  inspection.updatedBy = userId;

  await inspection.save();

  return await Inspection.findById(inspectionId)
    .populate("device")
    .populate("inspectionAgent", "fullName phone");
};

export const updateInspectionStatus = async (
  inspectionId,
  status,
  userId
) => {
  if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
    throw new ApiError(400, "Invalid inspection ID.");
  }

  const inspection = await Inspection.findById(
    inspectionId
  );

  if (!inspection) {
    throw new ApiError(404, "Inspection not found.");
  }

  inspection.status = status;

  if (status === "completed") {
    inspection.completedAt = new Date();
  }

  inspection.updatedBy = userId;

  await inspection.save();

  return inspection;
};

export const deleteInspection = async (
  inspectionId
) => {
  if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
    throw new ApiError(400, "Invalid inspection ID.");
  }

  const inspection = await Inspection.findById(
    inspectionId
  );

  if (!inspection) {
    throw new ApiError(404, "Inspection not found.");
  }

  await inspection.deleteOne();

  return;
};