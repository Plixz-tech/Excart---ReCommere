import modelService from "./model.service.js";

class ModelController {
  async createModel(req, res, next) {
    try {
      let image = "";

      if (req.file) {
        const { uploadBufferToCloudinary } = await import(
          "../../lib/uploadBuffer.js"
        );

        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          {
            folder: "excart/models",
            resource_type: "image",
          }
        );

        image = uploadedImage.secure_url;
      }

      const model = await modelService.createModel(
        {
          ...req.body,
          image,
        },
        req.user?.userId
      );

      return res.status(201).json({
        success: true,
        message: "Model created successfully.",
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModels(req, res, next) {
    try {
      const activeOnly = req.query.activeOnly !== "false";

      const models = await modelService.getModels({
        brandId: req.query.brandId,
        activeOnly,
      });

      return res.status(200).json({
        success: true,
        message: "Models fetched successfully.",
        data: models,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModelById(req, res, next) {
    try {
      const model = await modelService.getModelById(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Model fetched successfully.",
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateModel(req, res, next) {
    try {
      let image;

      if (req.file) {
        const { uploadBufferToCloudinary } = await import(
          "../../lib/uploadBuffer.js"
        );

        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          {
            folder: "excart/models",
            resource_type: "image",
          }
        );

        image = uploadedImage.secure_url;
      }

      const model = await modelService.updateModel(
        req.params.id,
        {
          ...req.body,
          ...(image !== undefined ? { image } : {}),
        },
        req.user?.userId
      );

      return res.status(200).json({
        success: true,
        message: "Model updated successfully.",
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateModel(req, res, next) {
    try {
      const model = await modelService.deactivateModel(
        req.params.id,
        req.user?.userId
      );

      return res.status(200).json({
        success: true,
        message: "Model deactivated successfully.",
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteModelPermanently(req, res, next) {
    try {
      const model = await modelService.deleteModelPermanently(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Model permanently deleted.",
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ModelController();