import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid service area ID.");

export const serviceAreaIdSchema = z.object({
  id: objectId,
});

const coordinateSchema = z
  .array(z.number())
  .length(2, "Coordinate must contain longitude and latitude.");

const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z
    .array(z.array(coordinateSchema).min(4))
    .min(1),
});

export const createServiceAreaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service area name is required."),

  description: z
    .string()
    .trim()
    .optional(),

  state: z
    .string()
    .trim()
    .min(2, "State is required."),

  district: z
    .string()
    .trim()
    .min(2, "District is required."),

  boundary: polygonSchema,

  pickupAvailable: z
    .boolean()
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});

export const updateServiceAreaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service area name is required.")
    .optional(),

  description: z
    .string()
    .trim()
    .optional(),

  state: z
    .string()
    .trim()
    .min(2, "State is required.")
    .optional(),

  district: z
    .string()
    .trim()
    .min(2, "District is required.")
    .optional(),

  boundary: polygonSchema.optional(),

  pickupAvailable: z
    .boolean()
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});