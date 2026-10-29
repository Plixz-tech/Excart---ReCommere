
import Model from "../../models/Model.js";

class ModelRepository {
  async create(data, session = null) {
    const [model] = await Model.create(
      [data],
      session ? { session } : {}
    );

    return model;
  }

  async findById(id) {
    return Model.findById(id).populate("brand", "name image");
  }

  async findByBrandAndName(brandId, name) {
    return Model.findOne({
      brand: brandId,
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
  }

  async findAll({ brandId, activeOnly = true } = {}) {
    const filter = {};

    if (brandId) filter.brand = brandId;
    if (activeOnly) filter.active = true;

    return Model.find(filter)
      .populate("brand", "name image")
      .sort({ name: 1 });
  }

  async updateById(id, data) {
    return Model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("brand", "name image");
  }

  async deactivateById(id, userId = null) {
    return this.updateById(id, {
      active: false,
      updatedBy: userId,
    });
  }

  // Permanently delete a model by its ID
  async deleteById(id) {
    return Model.findByIdAndDelete(id);
  }
}

export default new ModelRepository();
