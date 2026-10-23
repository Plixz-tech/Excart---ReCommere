
import brandRepository from "./brand.repository.js";

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

    return brandRepository.create({
      name,
      image: data.image?.trim() || "",
      active: data.active ?? true,
      createdBy: userId || null,
      updatedBy: userId || null,
    });
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

    return brandRepository.updateById(id, updates);
  }

  async deactivateBrand(id, userId) {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      const error = new Error("Brand not found.");
      error.statusCode = 404;
      throw error;
    }

    return brandRepository.updateById(id, {
      active: false,
      updatedBy: userId || null,
    });
  }
}

export default new BrandService();
