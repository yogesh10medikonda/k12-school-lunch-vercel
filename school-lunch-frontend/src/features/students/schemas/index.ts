import { z } from 'zod';

export const mealEligibilitySchema = z.enum(['free', 'reduced', 'paid', 'not_eligible']);
export const studentStatusSchema = z.enum(['Active', 'Inactive']);

export const studentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  studentId: z.string().trim().min(1, 'Student ID is required'),
  grade: z.string().min(1, 'Grade is required'),
  class: z.string().min(1, 'Class is required'),
  dateOfBirth: z.string().optional(),
  mealEligibility: mealEligibilitySchema,
  dietaryRestrictions: z.string(),
  allergies: z.string(),
  status: studentStatusSchema,
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export const splitList = (value: string) =>
  value.split(',').map((s) => s.trim()).filter(Boolean);