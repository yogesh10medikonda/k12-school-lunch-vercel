import { z } from 'zod';

const statuses = ['Active', 'Inactive'];

export const vendorCreateBodySchema = z.object({
  name: z.string().min(1, 'Vendor name is required').trim(),
  contactPerson: z.string().trim().optional(),
  email: z.string().email('Invalid email').trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  status: z.enum(statuses).default('Active'),
  rating: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const vendorUpdateBodySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    contactPerson: z.string().trim().optional(),
    email: z.string().email('Invalid email').trim().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    status: z.enum(statuses).optional(),
    rating: z.number().min(1).max(5).optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const vendorIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vendor ID format'),
  }),
});

export const vendorListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    status: z.enum(statuses).optional(),
  }),
});

// Route-ready wrappers { body?, query?, params? }
export const vendorCreateSchema = { body: vendorCreateBodySchema };
export const vendorUpdateSchema = { body: vendorUpdateBodySchema };