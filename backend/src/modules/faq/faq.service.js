import faqRepository from "./faq.repository.js";
import ApiError from "../../utils/errors/ApiError.js";

class FAQService {
  async createFAQ(data) {
    if (!data.question?.trim()) {
      throw new ApiError(400, "FAQ question is required.");
    }

    if (!data.answer?.trim()) {
      throw new ApiError(400, "FAQ answer is required.");
    }

    return faqRepository.create({
      question: data.question.trim(),
      answer: data.answer.trim(),
      category: data.category?.trim() || "general",
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  async getAllFAQs() {
    return faqRepository.findAll({
      isActive: true,
    });
  }

  async getFAQById(faqId) {
    const faq = await faqRepository.findById(faqId);

    if (!faq) {
      throw new ApiError(404, "FAQ not found.");
    }

    return faq;
  }

  async updateFAQ(faqId, data) {
    const faq = await faqRepository.findById(faqId);

    if (!faq) {
      throw new ApiError(404, "FAQ not found.");
    }

    const updateData = {};

    if (data.question !== undefined) {
      if (!data.question.trim()) {
        throw new ApiError(400, "FAQ question cannot be empty.");
      }

      updateData.question = data.question.trim();
    }

    if (data.answer !== undefined) {
      if (!data.answer.trim()) {
        throw new ApiError(400, "FAQ answer cannot be empty.");
      }

      updateData.answer = data.answer.trim();
    }

    if (data.category !== undefined) {
      updateData.category = data.category.trim();
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    return faqRepository.updateById(faqId, updateData);
  }

  async deleteFAQ(faqId) {
    const faq = await faqRepository.findById(faqId);

    if (!faq) {
      throw new ApiError(404, "FAQ not found.");
    }

    await faqRepository.deleteById(faqId);

    return {
      message: "FAQ deleted successfully.",
    };
  }
}

export default new FAQService();