import { z } from 'zod';

export const vendorStatusSchema = z.enum(['Active', 'Inactive']);

export const vendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required'),
  contactPerson: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Invalid email',
    }),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  status: vendorStatusSchema,
  rating: z
    .union([z.number(), z.string()])
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '' || val === null) return true;
        const num = Number(val);
        return !isNaN(num) && num >= 1 && num <= 5;
      },
      { message: 'Rating must be between 1 and 5' }
    ),
  notes: z.string().trim().optional(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;

export const vendorIngredientSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  ingredient: z.string().trim().min(1, 'Ingredient is required'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  unit: z.string().trim().min(1, 'Unit is required'),
});

export type VendorIngredientFormValues = z.infer<typeof vendorIngredientSchema>;
