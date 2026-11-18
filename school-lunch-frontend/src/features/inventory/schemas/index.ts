import { z } from 'zod';

export const unitSchema = z.enum(['g', 'ml', 'piece']);
export const ingredientStatusSchema = z.enum(['Active', 'Inactive']);

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, 'Ingredient name is required'),
  category: z.string().trim().optional(),
  unit: unitSchema,
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative').default(0),
  minStockLevel: z.coerce.number().min(0, 'Minimum stock level cannot be negative').default(0),
  expiryDate: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  status: ingredientStatusSchema.default('Active'),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

export const stockInOutSchema = z.object({
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  reason: z.string().trim().optional().default(''),
  reference: z.string().trim().optional().nullable(),
});

export type StockInOutFormValues = z.infer<typeof stockInOutSchema>;