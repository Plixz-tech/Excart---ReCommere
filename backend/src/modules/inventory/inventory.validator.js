import { z } from "zod";

const objectId = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ID"
  );

/**
 * Add device to inventory
 */
export const createInventorySchema =
  z.object({
    body: z.object({
      orderId: objectId,

      listedPrice: z
        .number()
        .min(
          0,
          "Listed price cannot be negative."
        ),

      notes: z
        .string()
        .max(1000)
        .optional(),
    }),
  });

/**
 * Inventory ID
 */
export const inventoryIdSchema =
  z.object({
    params: z.object({
      id: objectId,
    }),
  });

/**
 * Update inventory
 */
export const updateInventorySchema =
  z.object({
    params: z.object({
      id: objectId,
    }),

    body: z.object({
      listedPrice: z
        .number()
        .min(
          0,
          "Listed price cannot be negative."
        )
        .optional(),

      notes: z
        .string()
        .max(1000)
        .optional(),
    }),
  });

/**
 * List inventory item
 */
export const listInventorySchema =
  z.object({
    params: z.object({
      id: objectId,
    }),
  });

/**
 * Mark inventory item as sold
 */
export const sellInventorySchema =
  z.object({
    params: z.object({
      id: objectId,
    }),

    body: z.object({
      soldPrice: z
        .number()
        .positive(
          "Sold price must be greater than 0."
        ),

      soldTo: objectId.optional(),

      notes: z
        .string()
        .max(1000)
        .optional(),
    }),
  });