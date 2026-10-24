
import mongoose from "mongoose";
import modelRepository from "./model.repository.js";
import Brand from "../../models/Brand.js";

class ModelService {
  async createModel(data, userId) {
    const name = data.name?.trim();
    const brandId = data.brand;

    if (!name || name.length < 2) {
      const error = new Error(
        "Model name must contain at least 2 characters."
      );
      error.statusCode = 400;
      throw error;
    }

    if (name.length > 100) {
      const error = new Error(
        "Model name cannot exceed 100 characters."
      );
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      const error = new Error("A valid brand ID is required.");
      error.statusCode = 400;
      throw error;
    }

    const brand = await Brand.findById(brandId);

    if (!brand || !brand.active) {
      const error = new Error(
        "Brand not found or inactive."
      );
      error.statusCode = 400;
      throw error;
    }

    const existingModel =
      await modelRepository.findByBrandAndName(brandId, name);

    if (existingModel) {
      const error = new Error(
        "This model already exists under the selected brand."
      );
      error.statusCode = 409;
      throw error;
    }

    return modelRepository.create({
      brand: brandId,
      name,
      image: data.image?.trim() || "",
      active: data.active ?? true,
      createdBy: userId || null,
      updatedBy: userId || null,
    });
  }

  async getModels({ brandId, activeOnly = true } = {}) {
    if (
      brandId &&
      !mongoose.Types.ObjectId.isValid(brandId)
    ) {
      const error = new Error("Invalid brand ID.");
      error.statusCode = 400;
      throw error;
    }

    if (brandId) {
      const brand = await Brand.findById(brandId);

      if (!brand) {
        const error = new Error("Brand not found.");
        error.statusCode = 404;
        throw error;
      }
    }

    return modelRepository.findAll({ brandId, activeOnly });
  }

  async getModelById(id) {
    const model = await modelRepository.findById(id);

    if (!model) {
      const error = new Error("Model not found.");
      error.statusCode = 404;
      throw error;
    }

    return model;
  }

  async updateModel(id, data, userId) {
    const existingModel = await modelRepository.findById(id);

    if (!existingModel) {
      const error = new Error("Model not found.");
      error.statusCode = 404;
      throw error;
    }

    const updates = {};

    if (data.name !== undefined) {
      const name = data.name.trim();

      if (name.length < 2 || name.length > 100) {
        const error = new Error(
          "Model name must contain between 2 and 100 characters."
        );
        error.statusCode = 400;
        throw error;
      }

      const brandId = data.brand || existingModel.brand._id;

      const duplicate = await modelRepository.findByBrandAndName(
        brandId,
        name
      );

      if (
        duplicate &&
        duplicate._id.toString() !== id
      ) {
        const error = new Error(
          "This model already exists under the selected brand."
        );
        error.statusCode = 409;
        throw error;
      }

      updates.name = name;
    }

    if (data.brand !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(data.brand)) {
        const error = new Error("Invalid brand ID.");
        error.statusCode = 400;
        throw error;
      }

      const brand = await Brand.findById(data.brand);

      if (!brand || !brand.active) {
        const error = new Error(
          "Brand not found or inactive."
        );
        error.statusCode = 400;
        throw error;
      }

      updates.brand = data.brand;
    }

    if (data.image !== undefined) {
      updates.image = data.image.trim();
    }

    if (data.active !== undefined) {
      updates.active = data.active;
    }

    updates.updatedBy = userId || null;

    return modelRepository.updateById(id, updates);
  }

  async deactivateModel(id, userId) {
    const model = await modelRepository.findById(id);

    if (!model) {
      const error = new Error("Model not found.");
      error.statusCode = 404;
      throw error;
    }

    return modelRepository.deactivateById(id, userId);
  }
}

export default new ModelService();
