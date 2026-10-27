import Brand from "../../models/Brand.js";
import Model from "../../models/Model.js";
import DeviceCatalog from "../../models/DeviceCatalog.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
      name: {
        $regex: `^${escapeRegex(name.trim())}$`,
        $options: "i",
      },
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

  async findReferences(brand) {
    const [modelCount, catalogCount] = await Promise.all([
      Model.countDocuments({ brand: brand._id }),
      DeviceCatalog.countDocuments({
        brand: {
          $regex: `^\\s*${escapeRegex(brand.name.trim())}\\s*$`,
          $options: "i",
        },
      }),
    ]);

    return { modelCount, catalogCount };
  }

  async deleteById(id) {
    return Brand.findByIdAndDelete(id);
  }
}

export default new BrandRepository();