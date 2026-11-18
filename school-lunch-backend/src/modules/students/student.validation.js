import { z } from 'zod';

const eligibility = ['free', 'reduced', 'paid', 'not_eligible'];
const statuses = ['Active', 'Inactive'];

export const studentCreateBodySchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  studentId: z.string().min(1, 'Student ID is required').trim(),
  grade: z.string().min(1, 'Grade is required').trim(),
  class: z.string().min(1, 'Class is required').trim(),
  dateOfBirth: z.string().optional().nullable(),
  mealEligibility: z.enum(eligibility).default('paid'),
  dietaryRestrictions: z.array(z.string().trim()).default([]),
  allergies: z.array(z.string().trim()).default([]),
  status: z.enum(statuses).default('Active'),
});

export const studentUpdateBodySchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    studentId: z.string().min(1).trim().optional(),
    grade: z.string().min(1).trim().optional(),
    class: z.string().min(1).trim().optional(),
    dateOfBirth: z.string().optional().nullable(),
    mealEligibility: z.enum(eligibility).optional(),
    dietaryRestrictions: z.array(z.string().trim()).optional(),
    allergies: z.array(z.string().trim()).optional(),
    status: z.enum(statuses).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const studentIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'),
  }),
});

export const studentListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    grade: z.string().optional(),
    class: z.string().optional(),
    status: z.enum(statuses).optional(),
    mealEligibility: z.enum(eligibility).optional(),
    dietary: z.string().optional(),
  }),
});

// Route-ready wrappers { body?, query?, params? }
export const studentCreateSchema = { body: studentCreateBodySchema };
export const studentUpdateSchema = { body: studentUpdateBodySchema };