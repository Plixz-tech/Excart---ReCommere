import mongoose from "mongoose";
import Address from "../../models/Address.js";
import ApiError from "../../utils/errors/ApiError.js";

export const createAddress = async (
  addressData,
  customerId
) => {
  // Allow only one default address
  if (addressData.isDefault) {
    await Address.updateMany(
      { customer: customerId },
      { isDefault: false }
    );
  }

  const address = await Address.create({
    ...addressData,
    customer: customerId,
    createdBy: customerId,
  });

  return address;
};

export const getAddresses = async (customerId) => {
  return await Address.find({
    customer: customerId,
  }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

export const getAddressById = async (
  addressId,
  customerId
) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address ID.");
  }

  const address = await Address.findOne({
    _id: addressId,
    customer: customerId,
  });

  if (!address) {
    throw new ApiError(404, "Address not found.");
  }

  return address;
};

export const updateAddress = async (
  addressId,
  addressData,
  customerId
) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address ID.");
  }

  const address = await Address.findOne({
    _id: addressId,
    customer: customerId,
  });

  if (!address) {
    throw new ApiError(404, "Address not found.");
  }

  // Allow only one default address
  if (addressData.isDefault) {
    await Address.updateMany(
      { customer: customerId },
      { isDefault: false }
    );
  }

  Object.keys(addressData).forEach((key) => {
    address[key] = addressData[key];
  });

  address.updatedBy = customerId;

  await address.save();

  return address;
};

export const deleteAddress = async (
  addressId,
  customerId
) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address ID.");
  }

  const address = await Address.findOne({
    _id: addressId,
    customer: customerId,
  });

  if (!address) {
    throw new ApiError(404, "Address not found.");
  }

  await address.deleteOne();

  return;
};