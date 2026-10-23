
import brandService from "./brand.service.js";
import { uploadBufferToCloudinary } from "../../lib/uploadBuffer.js";

class BrandController {
    async createBrand(req, res, next) {
        try {
            let image = "";

            if (req.file) {
                if (!req.file.mimetype.startsWith("image/")) {
                    const error = new Error("Please upload a valid brand logo image.");
                    error.statusCode = 400;
                    throw error;
                }

                const uploadedImage = await uploadBufferToCloudinary(
                    req.file.buffer,
                    {
                        folder: "excart/brands",
                        resource_type: "image",
                    }
                );

                image = uploadedImage.secure_url;
            }

            const brand = await brandService.createBrand(
                {
                    ...req.body,
                    image,
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
            const brand = await brandService.updateBrand(
                req.params.id,
                req.body,
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
}

export default new BrandController();
