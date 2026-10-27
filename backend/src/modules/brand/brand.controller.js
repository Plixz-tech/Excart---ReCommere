
import brandService from "./brand.service.js";
import { uploadBufferToCloudinary } from "../../lib/uploadBuffer.js";

// Keep this helper outside the controller class so Express binding
// cannot cause `this.uploadBrandImage` errors.
async function uploadBrandImage(file) {
  if (!file) return undefined;

  if (!file.mimetype?.startsWith("image/")) {
    const error = new Error(
      "Please upload a valid brand logo image."
    );
    error.statusCode = 400;
    throw error;
  }

  const uploadedImage = await uploadBufferToCloudinary(
    file.buffer,
    {
      folder: "excart/brands",
      resource_type: "image",
    }
  );

  return uploadedImage.secure_url;
}

class BrandController {
  async createBrand(req, res, next) {
    try {
      const image = await uploadBrandImage(req.file);

      const brand = await brandService.createBrand(
        {
          ...req.body,
          ...(image !== undefined && { image }),
        },
        req.user?.userId
      );

      return res.status(201).json({
        success: true,
        message: "Brand created successfully.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrands(req, res, next) {
    try {
      const activeOnly = req.query.activeOnly !== "false";

      const brands = await brandService.getBrands({
        activeOnly,
      });

      return res.status(200).json({
        success: true,
        message: "Brands fetched successfully.",
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrandById(req, res, next) {
    try {
      const brand = await brandService.getBrandById(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Brand fetched successfully.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBrand(req, res, next) {
    try {
      const image = await uploadBrandImage(req.file);
      const updates = { ...req.body };

      if (image !== undefined) {
        updates.image = image;
      }

      if (updates.active === "true") {
        updates.active = true;
      } else if (updates.active === "false") {
        updates.active = false;
      }

      const brand = await brandService.updateBrand(
        req.params.id,
        updates,
        req.user?.userId
      );

      return res.status(200).json({
        success: true,
        message: "Brand updated successfully.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateBrand(req, res, next) {
    try {
      const brand = await brandService.deactivateBrand(
        req.params.id,
        req.user?.userId
      );

      return res.status(200).json({
        success: true,
        message: "Brand deactivated successfully.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async permanentlyDeleteBrand(req, res, next) {
    try {
      const brand = await brandService.permanentlyDeleteBrand(
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message: "Brand permanently deleted.",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BrandController();
