import FAQ from "../../models/FAQ.js";

class FAQRepository {
  async create(data) {
    return FAQ.create(data);
  }

  async findById(faqId) {
    return FAQ.findById(faqId);
  }

  async findAll(filter = {}) {
    return FAQ.find(filter).sort({ createdAt: -1 });
  }

  async updateById(faqId, data) {
    return FAQ.findByIdAndUpdate(faqId, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(faqId) {
    return FAQ.findByIdAndDelete(faqId);
  }
}

export default new FAQRepository();