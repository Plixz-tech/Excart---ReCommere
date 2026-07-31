import { z } from "zod";

export const createDeviceSchema = z.object({
    body: z.object({
        brand: z
            .string()
            .trim()
            .min(2, "Brand is required."),

        model: z
            .string()
            .trim()
            .min(2, "Model is required."),

        variant: z.string().trim().optional(),

        color: z.string().trim().optional(),

        storage: z.string().trim().optional(),

        ram: z.string().trim().optional(),

        imei1: z
            .string()
            .trim()
            .length(15, "IMEI1 must be 15 digits."),

        imei2: z
            .string()
            .trim()
            .length(15, "IMEI2 must be 15 digits.")
            .optional(),

        serialNumber: z
            .string()
            .trim()
            .optional(),

        purchasePrice: z
            .number()
            .min(0)
            .optional(),

        expectedSellingPrice: z
            .number()
            .min(0)
            .optional(),

        customer: z.string().optional(),

        pickupAgent: z.string().optional(),

        inspectionAgent: z.string().optional(),
    }),
});

export const updateDeviceSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Device ID is required."),
    }),

    body: z.object({
        brand: z.string().trim().optional(),
        model: z.string().trim().optional(),
        variant: z.string().trim().optional(),
        color: z.string().trim().optional(),
        storage: z.string().trim().optional(),
        ram: z.string().trim().optional(),

        imei1: z
            .string()
            .trim()
            .length(15, "IMEI1 must be 15 digits.")
            .optional(),
        imei2: z
            .string()
            .trim()
            .length(15, "IMEI2 must be 15 digits.")
            .optional(),
        serialNumber: z.string().trim().optional(),

        purchasePrice: z.number().min(0).optional(),
        expectedSellingPrice: z.number().min(0).optional(),

        customer: z.string().optional(),
        pickupAgent: z.string().optional(),
        inspectionAgent: z.string().optional(),
    }),
});

export const updateDeviceStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Device ID is required."),
    }),

    body: z.object({
        status: z.enum([
            "pending_pickup",
            "picked_up",
            "inspection_pending",
            "inspection_completed",
            "approved",
            "rejected",
            "inventory",
            "listed",
            "sold",
            "returned",
        ]),
    }),
});