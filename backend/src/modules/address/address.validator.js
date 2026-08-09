import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");

export const createAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number is required."),

  addressLine1: z
    .string()
    .trim()
    .min(3, "Address Line 1 is required."),

  addressLine2: z.string().trim().optional(),

  landmark: z.string().trim().optional(),

  city: z.string().trim().min(2, "City is required."),

  state: z.string().trim().min(2, "State is required."),

  pincode: z.string().trim().min(4).max(10),

  latitude: z
    .coerce
    .number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: z
    .coerce
    .number()
    .min(-180)
    .max(180)
    .optional(),

  isDefault: z.boolean().optional(),
});
export const updateAddressSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    fullName: z.string().trim().optional(),

    phone: z.string().trim().optional(),

    addressLine1: z.string().trim().optional(),

    addressLine2: z.string().trim().optional(),

    landmark: z.string().trim().optional(),

    city: z.string().trim().optional(),

    state: z.string().trim().optional(),

    pincode: z.string().trim().optional(),

    latitude: z
      .coerce
      .number()
      .min(-90)
      .max(90)
      .optional(),

    longitude: z
      .coerce
      .number()
      .min(-180)
      .max(180)
      .optional(),

    isDefault: z.boolean().optional(),
  }),
});