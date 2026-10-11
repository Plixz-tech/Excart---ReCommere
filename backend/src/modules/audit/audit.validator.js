import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId."
  );

export const auditIdSchema = z.object({
  id: objectId,
});

export const auditEntitySchema = z.object({
  entityType: z
    .string()
    .trim()
    .min(1, "Entity type is required."),

  entityId: objectId,
});

export const auditActorSchema = z.object({
  actorId: objectId,
});

export const auditListSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),

  actor: objectId.optional(),

  module: z
    .string()
    .trim()
    .optional(),

  action: z
    .string()
    .trim()
    .optional(),

  entityType: z
    .string()
    .trim()
    .optional(),

  entityId: objectId.optional(),
});