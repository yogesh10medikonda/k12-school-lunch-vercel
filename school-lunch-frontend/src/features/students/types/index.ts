/**
 * Student domain types.
 * Field names match the backend Student model exactly (see school-lunch-backend
 * src/modules/students/student.model.js) so create/update payloads align 1:1.
 */
export type MealEligibility = 'free' | 'reduced' | 'paid' | 'not_eligible';
export type StudentStatus = 'Active' | 'Inactive';

export interface Student {
  _id: string;
  name: string;
  studentId: string;
  grade: string;
  class: string;
  dateOfBirth?: string | null;
  mealEligibility: MealEligibility;
  dietaryRestrictions: string[];
  allergies: string[];
  status: StudentStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload for create/update (server-generated fields omitted). */
export type StudentInput = Omit<Student, '_id' | 'createdAt' | 'updatedAt'>;

export interface StudentMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentsListResponse {
  data: Student[];
  meta: StudentMeta;
}

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  grade?: string;
  class?: string;
  status?: StudentStatus;
  dietary?: string;
  mealEligibility?: MealEligibility;
}
