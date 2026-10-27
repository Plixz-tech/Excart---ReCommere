
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

    const updates = { ...data };

    if (updates.name !== undefined) {
      const name = updates.name?.trim();

      if (!name) {
        const error = new Error("Brand name cannot be empty.");
        error.statusCode = 400;
        throw error;
      }

      const existingBrand = await brandRepository.findByName(name);

      if (
        existingBrand &&
        existingBrand._id.toString() !== id.toString()
      ) {
        const error = new Error("This brand name is already in use.");
        error.statusCode = 409;
        throw error;
      }

      updates.name = name;
    }

    updates.updatedBy = userId || null;

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

  async permanentlyDeleteBrand(id) {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      const error = new Error("Brand not found.");
      error.statusCode = 404;
      throw error;
    }

    const { modelCount, catalogCount } =
      await brandRepository.findReferences(brand);

    if (modelCount > 0 || catalogCount > 0) {
      const error = new Error(
        "This brand cannot be deleted because it is used by existing models or catalog entries. Deactivate it instead."
      );
      error.statusCode = 409;
      throw error;
    }

    await brandRepository.deleteById(id);

    broadcastDataChanges({
      entity: "brands",
      action: "deleted",
      recordId: brand._id,
    });

    return brand;
  }
}

export default new BrandService();
