import mongoose from "mongoose";

import ServiceArea from "../../models/ServiceArea.js";

import ApiError from "../../utils/errors/ApiError.js";

export const createServiceArea = async (
  serviceAreaData,
  adminId
) => {
  return await ServiceArea.create({
    ...serviceAreaData,
    createdBy: adminId,
  });
};

export const getServiceAreas = async () => {
  return await ServiceArea.find().sort({
    createdAt: -1,
  });
};

export const getServiceAreaById = async (
  serviceAreaId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(serviceAreaId)
  ) {
    throw new ApiError(
      400,
      "Invalid service area ID."
    );
  }

  const serviceArea =
    await ServiceArea.findById(serviceAreaId);

  if (!serviceArea) {
    throw new ApiError(
      404,
      "Service area not found."
    );
  }

  return serviceArea;
};

export const updateServiceArea = async (
  serviceAreaId,
  serviceAreaData,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(serviceAreaId)
  ) {
    throw new ApiError(
      400,
      "Invalid service area ID."
    );
  }

  const serviceArea =
    await ServiceArea.findById(serviceAreaId);

  if (!serviceArea) {
    throw new ApiError(
      404,
      "Service area not found."
    );
  }

  Object.keys(serviceAreaData).forEach((key) => {
    serviceArea[key] = serviceAreaData[key];
  });

  serviceArea.updatedBy = adminId;

  await serviceArea.save();

  return serviceArea;
};

export const deleteServiceArea = async (
  serviceAreaId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(serviceAreaId)
  ) {
    throw new ApiError(
      400,
      "Invalid service area ID."
    );
  }

  const serviceArea =
    await ServiceArea.findById(serviceAreaId);

  if (!serviceArea) {
    throw new ApiError(
      404,
      "Service area not found."
    );
  }

  await serviceArea.deleteOne();
};


export const findServiceAreaByLocation = async (
  longitude,
  latitude
) => {
  const serviceArea = await ServiceArea.findOne({
    isActive: true,
    pickupAvailable: true,

    boundary: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [
            longitude,
            latitude,
          ],
        },
      },
    },
  });

  return serviceArea;
};

export const checkLocationServiceability = async (
  latitude,
  longitude
) => {
  const serviceArea = await ServiceArea.findOne({
    isActive: true,
    pickupAvailable: true,

    boundary: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
    },
  }).select(
    "_id name description state district pickupAvailable isActive"
  );

  return serviceArea;
};