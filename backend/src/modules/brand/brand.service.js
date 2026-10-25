
import brandRepository from "./brand.repository.js";
import broadcastDataChanges from "../../middlewares/realtime/broadcastDataChanges.js";

class BrandService {
  async createBrand(data, userId) {
    const name = data.name?.trim();

    if (!name) {
      const error = new Error("Brand name is required.");
      error.statusCode = 400;
      throw error;
    }

    const existingBrand = await brandRepository.findByName(name);

    if (existingBrand) {
      const error = new Error("This brand already exists.");
      error.statusCode = 409;
      throw error;
    }

    const brand = await brandRepository.create({
      name,
      image: data.image?.trim() || "",
      active: data.active ?? true,
      createdBy: userId || null,
      updatedBy: userId || null,
    });

    broadcastDataChanges({
      entity: "brands",
      action: "created",
      recordId: brand._id,
    });

    return brand;
  }

  async getBrands({ activeOnly = true } = {}) {
    return brandRepository.findAll({ activeOnly });
  }

  async getBrandById(id) {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      const error = new Error("Brand not found.");
      error.statusCode = 404;
      throw error;
    }

    return brand;
  }

  async updateBrand(id, data, userId) {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      const error = new Error("Brand not found.");
      error.statusCode = 404;
      throw error;
    }

    if (data.name !== undefined) {
      const name = data.name.trim();

      if (!name) {
        const error = new Error("Brand name cannot be empty.");
        error.statusCode = 400;
        throw error;
      }

      const existingBrand = await brandRepository.findByName(name);

      if (existingBrand && existingBrand._id.toString() !== id) {
        const error = new Error("This brand name is already in use.");
        error.statusCode = 409;
        throw error;
      }

      data.name = name;
    }

    const updates = {
      ...data,
      updatedBy: userId || null,
    };

    const updatedBrand = await brandRepository.updateById(id, updates);

    if (updatedBrand) {
      broadcastDataChanges({
        entity: "brands",
        action: "updated",
        recordId: updatedBrand._id,
      });
    }

    return updatedBrand;
  }

  async deactivateBrand(id, userId) {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      const error = new Error("Brand not found.");
      error.statusCode = 404;
      throw error;
    }

    const updatedBrand = await brandRepository.updateById(id, {
      active: false,
      updatedBy: userId || null,
    });

    if (updatedBrand) {
      broadcastDataChanges({
        entity: "brands",
        action: "deactivated",
        recordId: updatedBrand._id,
      });
    }

    return updatedBrand;
  }
}

export default new BrandService();
