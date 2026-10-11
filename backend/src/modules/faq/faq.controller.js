import faqService from "./faq.service.js";

class FAQController {
  async createFAQ(req, res) {
    const faq = await faqService.createFAQ(req.body);

    res.status(201).json({
      success: true,
      message: "FAQ created successfully.",
      data: faq,
    });
  }

  async getAllFAQs(req, res) {
    const faqs = await faqService.getAllFAQs();

    res.status(200).json({
      success: true,
      data: faqs,
    });
  }

  async getFAQById(req, res) {
    const faq = await faqService.getFAQById(req.params.faqId);

    res.status(200).json({
      success: true,
      data: faq,
    });
  }

  async updateFAQ(req, res) {
    const faq = await faqService.updateFAQ(
      req.params.faqId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully.",
      data: faq,
    });
  }

  async deleteFAQ(req, res) {
    const result = await faqService.deleteFAQ(req.params.faqId);

    res.status(200).json({
      success: true,
      ...result,
    });
  }
}

export default new FAQController();