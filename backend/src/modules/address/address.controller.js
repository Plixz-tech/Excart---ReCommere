import * as addressService from "./address.service.js";
import asyncHandler from "../../utils/api/asyncHandler.js";
import ApiResponse from "../../utils/response/ApiResponse.js";

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(
    req.body,
    req.user.userId
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      address,
      "Address created successfully."
    )
  );
});

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(
    req.user.userId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      addresses,
      "Addresses fetched successfully."
    )
  );
});

export const getAddressById = asyncHandler(async (req, res) => {
  const address = await addressService.getAddressById(
    req.params.id,
    req.user.userId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      address,
      "Address fetched successfully."
    )
  );
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(
    req.params.id,
    req.body,
    req.user.userId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      address,
      "Address updated successfully."
    )
  );
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(
    req.params.id,
    req.user.userId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Address deleted successfully."
    )
  );
});

export const getLocationByPincode = asyncHandler(async (req, res) => {
  const location = await addressService.getLocationByPincode(
    req.params.pincode
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      location,
      "Location fetched successfully."
    )
  );
});