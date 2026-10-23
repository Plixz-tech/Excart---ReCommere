
import Brand from "../../models/Brand.js";

class BrandRepository {
  async create(data, session = null) {
    const [brand] = await Brand.create(
      [data],
      session ? { session } : {}
    );

    return brand;
  }

  async findById(id) {
    return Brand.findById(id);
  }

  async findByName(name) {
    return Brand.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
  }

  async findAll({ activeOnly = true } = {}) {
    const filter = activeOnly ? { active: true } : {};

    return Brand.find(filter).sort({ name: 1 });
  }

  async updateById(id, data) {
    return Brand.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deactivateById(id) {
    return Brand.findByIdAndUpdate(
      id,
      { active: false },
      { new: true, runValidators: true }
    );
  }
}

export default new BrandRepository();
