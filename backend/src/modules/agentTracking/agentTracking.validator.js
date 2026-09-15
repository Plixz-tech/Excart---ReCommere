import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

export const updateLocationSchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, "Invalid latitude.")
    .max(90, "Invalid latitude."),

  longitude: z.coerce
    .number()
    .min(-180, "Invalid longitude.")
    .max(180, "Invalid longitude."),

  orderId: objectId.optional(),
});

export const orderTrackingParamsSchema = z.object({
  id: objectId,
});