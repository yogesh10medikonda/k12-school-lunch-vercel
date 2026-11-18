import { z } from 'zod';

export const vendorIngredientCreateBodySchema = z.object({
  vendor: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vendor ID format'),
  ingredient: z.string().min(1, 'Ingredient is required').trim(),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .nonnegative('Price cannot be negative'),
  unit: z.string().min(1, 'Unit is required').trim(),
});

export const vendorIngredientIdParamSchema = z.object({
  params: z.object({
    ingredientId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ingredient price ID format'),
  }),
});

// Route-ready wrappers
export const vendorIngredientCreateSchema = {
  body: vendorIngredientCreateBodySchema,
};