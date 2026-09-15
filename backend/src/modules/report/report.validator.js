import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

const orderStatus = z.enum([
  "pending",
  "pickup_scheduled",
  "assigned",
  "picked_up",
  "in_transit",
  "inspection_pending",
  "inspection_in_progress",
  "inspection_completed",
  "approved",
  "payment_pending",
  "payment_completed",
  "ready_stock",
  "completed",
  "cancelled",
  "rejected",
]);

export const orderReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),

  status: orderStatus.optional(),

  agent: objectId.optional(),

  customer: objectId.optional(),
});