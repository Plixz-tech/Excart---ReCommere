import * as serviceAreaRepository from "./serviceArea.repository.js";
import * as locationService from "../../services/location.service.js";
import ApiError from "../../utils/errors/ApiError.js";

export const createServiceArea = async (
  serviceAreaData,
  adminId
) => {
  return await serviceAreaRepository.createServiceArea(
    serviceAreaData,
    adminId
  );
};

export const getServiceAreas = async () => {
  return await serviceAreaRepository.getServiceAreas();
};

export const getServiceAreaById = async (
  serviceAreaId
) => {
  return await serviceAreaRepository.getServiceAreaById(
    serviceAreaId
  );
};

export const updateServiceArea = async (
  serviceAreaId,
  serviceAreaData,
  adminId
) => {
  return await serviceAreaRepository.updateServiceArea(
    serviceAreaId,
    serviceAreaData,
    adminId
  );
};

export const deleteServiceArea = async (
  serviceAreaId
) => {
  return await serviceAreaRepository.deleteServiceArea(
    serviceAreaId
  );
};


export const checkServiceability = async (
  pincode
) => {



  if (!pincode || !/^\d{6}$/.test(pincode)) {
    throw new ApiError(
      400,
      "Please enter a valid 6-digit pincode."
    );
  }


  const location =
    await locationService.getLocationByPincode(
      pincode
    );


  const serviceArea =
    await serviceAreaRepository.findServiceAreaByLocation(
      location.longitude,
      location.latitude
    );

  if (!serviceArea) {
    return {
      pincode,
      latitude: location.latitude,
      longitude: location.longitude,
      pickupAvailable: false,
      serviceArea: null,
    };
  }


  return {
    pincode,
    latitude: location.latitude,
    longitude: location.longitude,

    pickupAvailable: true,

    serviceArea: {
      id: serviceArea._id,
      name: serviceArea.name,
      description: serviceArea.description,
      state: serviceArea.state,
      district: serviceArea.district,
    },
  };
};

export const checkLocationServiceability = async (
  latitude,
  longitude
) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(
      400,
      "Latitude and longitude must be valid numbers."
    );
  }

  if (lat < -90 || lat > 90) {
    throw new ApiError(
      400,
      "Latitude must be between -90 and 90."
    );
  }

  if (lng < -180 || lng > 180) {
    throw new ApiError(
      400,
      "Longitude must be between -180 and 180."
    );
  }

  const serviceArea =
    await serviceAreaRepository.checkLocationServiceability(
      lat,
      lng
    );

  return {
    latitude: lat,
    longitude: lng,
    pickupAvailable: !!serviceArea,
    serviceArea: serviceArea
      ? {
          id: serviceArea._id,
          name: serviceArea.name,
          description: serviceArea.description,
          state: serviceArea.state,
          district: serviceArea.district,
        }
      : null,
  };
};