class SupportController {
  async getCallSupport(req, res) {
    res.status(200).json({
      success: true,
      data: {
        phone: process.env.SUPPORT_PHONE,
      },
    });
  }

  async getWhatsAppSupport(req, res) {
    res.status(200).json({
      success: true,
      data: {
        phone: process.env.SUPPORT_PHONE,
      },
    });
  }
}

export default new SupportController();