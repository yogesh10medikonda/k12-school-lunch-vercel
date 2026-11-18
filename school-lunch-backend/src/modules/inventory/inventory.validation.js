import { z } from 'zod';

const statuses = ['Active', 'Inactive'];
const units = ['g', 'ml', 'piece'];
const movementTypes = ['IN', 'OUT', 'ADJUSTMENT'];
const availabilityFilters = ['in_stock', 'low_stock', 'out_of_stock'];
const expiryFilters = ['expired', 'expiring_soon', 'valid'];

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ─── Ingredient CRUD ─────────────────────────────────────────────────────────

export const ingredientCreateBodySchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').trim(),
  category: z.string().trim().optional(),
  unit: z.enum(units, { error: 'Unit must be g, ml, or piece' }),
  quantity: z.number().min(0, 'Quantity cannot be negative').default(0),
  minStockLevel: z.number().min(0, 'Minimum stock level cannot be negative').default(0),
  expiryDate: z.string().optional().nullable(),
  vendor: z
    .string()
    .regex(objectIdRegex, 'Invalid vendor ID format')
    .optional()
    .nullable(),
  status: z.enum(statuses).default('Active'),
});

export const ingredientUpdateBodySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    category: z.string().trim().optional(),
    unit: z.enum(units).optional(),
    quantity: z.number().min(0, 'Quantity cannot be negative').optional(),
    minStockLevel: z
      .number()
      .min(0, 'Minimum stock level cannot be negative')
      .optional(),
    expiryDate: z.string().optional().nullable(),
    vendor: z
      .string()
      .regex(objectIdRegex, 'Invalid vendor ID format')
      .optional()
      .nullable(),
    status: z.enum(statuses).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const ingredientIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid ingredient ID format'),
  }),
});

export const ingredientListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(statuses).optional(),
    availability: z.enum(availabilityFilters).optional(),
    expiry: z.enum(expiryFilters).optional(),
  }),
});

// ─── Stock movements ──────────────────────────────────────────────────────────

const positiveQtySchema = z
  .number({ error: 'quantity must be a number' })
  .positive('Quantity must be greater than zero');

export const stockInBodySchema = z.object({
  quantity: positiveQtySchema,
  reason: z.string().trim().optional().default(''),
  reference: z.string().trim().optional().nullable(),
});

export const stockOutBodySchema = z.object({
  quantity: positiveQtySchema,
  reason: z.string().trim().optional().default(''),
  reference: z.string().trim().optional().nullable(),
});

export const movementListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alertsQuerySchema = z.object({
  query: z.object({
    days: z
      .string()
      .regex(/^\d+$/, 'days must be a non-negative integer')
      .optional(),
  }),
});

// ─── Availability check ───────────────────────────────────────────────────────

export const availabilityCheckBodySchema = z.object({
  items: z
    .array(
      z.object({
        ingredientId: z
          .string()
          .regex(objectIdRegex, 'Invalid ingredient ID format'),
        requiredQuantity: z
          .number()
          .positive('Required quantity must be greater than zero'),
      })
    )
    .min(1, 'At least one item is required'),
});

// ─── Route-ready wrappers ─────────────────────────────────────────────────────

export const ingredientCreateSchema = { body: ingredientCreateBodySchema };
export const ingredientUpdateSchema = { body: ingredientUpdateBodySchema };
export const stockInSchema = { body: stockInBodySchema };
export const stockOutSchema = { body: stockOutBodySchema };
export const availabilityCheckSchema = { body: availabilityCheckBodySchema };
