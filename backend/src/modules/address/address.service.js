import * as addressRepository from "./address.repository.js";
import * as locationService from "../../services/location.service.js";
import * as serviceAreaService from "../serviceArea/serviceArea.service.js";
import ApiError from "../../utils/errors/ApiError.js";
// Create Address
export const createAddress = async (
  addressData,
  customerId
) => {
  let latitude = addressData.latitude;
  let longitude = addressData.longitude;
  // If coordinates are not provided,
  // get approximate coordinates from the pincode.
  if (
    latitude === undefined ||
    longitude === undefined
  ) {
    const location =
      await locationService.getLocationByPincode(
        addressData.pincode
      );
    latitude = location.latitude;
    longitude = location.longitude;
  }
  // Check whether the location is inside
  // an active pickup service area.
  const serviceability =
    await serviceAreaService.checkLocationServiceability(
      latitude,
      longitude
    );
  if (!serviceability.pickupAvailable) {
    throw new ApiError(
      400,
      "Pickup is not available at this location."
    );
  }
  // Save the coordinates that were actually checked.
  const finalAddressData = {
    ...addressData,
    latitude,
    longitude,
  };
  return await addressRepository.createAddress(
    finalAddressData,
    customerId
  );
};
// Get all addresses
export const getAddresses = async (customerId) => {
  return await addressRepository.getAddresses(
    customerId
  );
};
// Get address by ID
export const getAddressById = async (
  addressId,
  customerId
) => {
  return await addressRepository.getAddressById(
    addressId,
    customerId
  );
};
// Update address
export const updateAddress = async (
  addressId,
  addressData,
  customerId
) => {
  const existingAddress =
    await addressRepository.getAddressById(
      addressId,
      customerId
    );
  const finalAddressData = {
    ...addressData,
  };
  // If pincode is changed, get the new
  // location from the new pincode.
  if (
    addressData.pincode !== undefined &&
    addressData.pincode !== existingAddress.pincode
  ) {
    const location =
      await locationService.getLocationByPincode(
        addressData.pincode
      );
    finalAddressData.latitude =
      location.latitude;
    finalAddressData.longitude =
      location.longitude;
  }
  // If exact coordinates are supplied,
  // use them for serviceability checking.
  const latitude =
    finalAddressData.latitude ??
    existingAddress.latitude;
  const longitude =
    finalAddressData.longitude ??
    existingAddress.longitude;
  // Check the final location.
  const serviceability =
    await serviceAreaService.checkLocationServiceability(
      latitude,
      longitude
    );
  if (!serviceability.pickupAvailable) {
    throw new ApiError(
      400,
      "Pickup is not available at this location."
    );
  }
  // Save the coordinates that were actually checked.
  finalAddressData.latitude = latitude;
  finalAddressData.longitude = longitude;
  return await addressRepository.updateAddress(
    addressId,
    finalAddressData,
    customerId
  );
};
// Delete address
export const deleteAddress = async (
  addressId,
  customerId
) => {
  return await addressRepository.deleteAddress(
    addressId,
    customerId
  );
};
// Get location by pincode
export const getLocationByPincode = async (
  pincode
) => {
  return await locationService.getLocationByPincode(
    pincode
  );
};