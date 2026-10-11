import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");

export const userIdSchema = z.object({
  id: objectId,
});

export const getUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),

  search: z.string().trim().optional(),

  status: z
    .enum(["active", "blocked", "deleted"])
    .optional(),

  sortBy: z
    .enum([
      "fullName",
      "email",
      "phone",
      "status",
      "createdAt",
    ])
    .optional(),

  order: z
    .enum(["asc", "desc"])
    .optional(),
});

export const updateUserSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100)
      .optional(),

    email: z
      .string()
      .trim()
      .email("Invalid email address.")
      .optional(),

    profileImage: z
      .string()
      .trim()
      .optional(),

    status: z
      .enum(["active", "blocked"])
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        "At least one field is required to update the user.",
    }
  );

export const updateUserStatusSchema = z.object({
  status: z.enum(
    ["active", "blocked"],
    {
      message: "Status must be active or blocked.",
    }
  ),
});