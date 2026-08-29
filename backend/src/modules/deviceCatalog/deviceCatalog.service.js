import mongoose from "mongoose";
import ApiError from "../../utils/errors/ApiError.js";
import * as deviceCatalogRepository from "./deviceCatalog.repository.js";

// CREATE

export const createDeviceCatalog = async (data, userId) => {
  if (!data.brand) {
    throw new ApiError(400, "Brand is required.");
  }

  if (!data.model) {
    throw new ApiError(400, "Model is required.");
  }

  if (
    data.valuationPrice === undefined ||
    data.valuationPrice === null
  ) {
    throw new ApiError(
      400,
      "Valuation price is required."
    );
  }

  if (Number(data.valuationPrice) < 0) {
    throw new ApiError(
      400,
      "Valuation price cannot be negative."
    );
  }

  return deviceCatalogRepository.create({
    brand: data.brand.trim(),
    model: data.model.trim(),
    variant: data.variant?.trim() || "",
    storage: data.storage?.trim() || "",
    ram: data.ram?.trim() || "",
    valuationPrice: Number(data.valuationPrice),
    active:
      data.active !== undefined
        ? data.active
        : true,
    createdBy: userId || null,
    updatedBy: userId || null,
  });
};

// GET ACTIVE CATALOG

export const getActiveDeviceCatalog = async () => {
  return deviceCatalogRepository.findActive();
};

// GET ALL CATALOG

export const getAllDeviceCatalog = async () => {
  return deviceCatalogRepository.findAll();
};

// GET BY ID

export const getDeviceCatalogById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      "Invalid device catalog ID."
    );
  }

  const catalog =
    await deviceCatalogRepository.findById(id);

  if (!catalog) {
    throw new ApiError(
      404,
      "Device catalog not found."
    );
  }

  return catalog;
};

// FIND MATCHING CATALOG

export const findMatchingDeviceCatalog = async ({
  brand,
  model,
  variant,
}) => {
  if (!brand || !model) {
    throw new ApiError(
      400,
      "Brand and model are required."
    );
  }

  const catalog =
    await deviceCatalogRepository.findMatching({
      brand,
      model,
      variant,
    });

  if (!catalog) {
    throw new ApiError(
      404,
      "Matching device catalog not found."
    );
  }

  return catalog;
};

// UPDATE

export const updateDeviceCatalog = async (
  id,
  data,
  userId
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      "Invalid device catalog ID."
    );
  }

  const existing =
    await deviceCatalogRepository.findById(id);

  if (!existing) {
    throw new ApiError(
      404,
      "Device catalog not found."
    );
  }

  const updateData = {
    updatedBy: userId || null,
  };

  if (data.brand !== undefined) {
    updateData.brand = data.brand.trim();
  }

  if (data.model !== undefined) {
    updateData.model = data.model.trim();
  }

  if (data.variant !== undefined) {
    updateData.variant = data.variant.trim();
  }

  if (data.storage !== undefined) {
    updateData.storage = data.storage.trim();
  }

  if (data.ram !== undefined) {
    updateData.ram = data.ram.trim();
  }

  if (data.valuationPrice !== undefined) {
    if (Number(data.valuationPrice) < 0) {
      throw new ApiError(
        400,
        "Valuation price cannot be negative."
      );
    }

    updateData.valuationPrice =
      Number(data.valuationPrice);
  }

  if (data.active !== undefined) {
    updateData.active = data.active;
  }

  return deviceCatalogRepository.updateById(
    id,
    updateData
  );
};

// DELETE

export const deleteDeviceCatalog = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      "Invalid device catalog ID."
    );
  }

  const existing =
    await deviceCatalogRepository.findById(id);

  if (!existing) {
    throw new ApiError(
      404,
      "Device catalog not found."
    );
  }

  await deviceCatalogRepository.deleteById(id);

  return {
    message:
      "Device catalog deleted successfully.",
  };
};