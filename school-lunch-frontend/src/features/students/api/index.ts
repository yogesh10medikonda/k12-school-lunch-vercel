import { apiClient, AppApiError } from '@/lib/api-client';
import type {
  Student,
  StudentInput,
  StudentsListResponse,
  ListStudentsParams,
} from '@/features/students/types';

export async function listStudents(params: ListStudentsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.grade) searchParams.set('grade', params.grade);
  if (params.class) searchParams.set('class', params.class);
  if (params.status) searchParams.set('status', params.status);
  if (params.dietary) searchParams.set('dietary', params.dietary);
  if (params.mealEligibility)
    searchParams.set('mealEligibility', params.mealEligibility);

  const qs = searchParams.toString();
  return apiClient<StudentsListResponse>(qs ? `/students?${qs}` : '/students');
}

export async function getStudentById(id: string) {
  return apiClient<Student>(`/students/${id}`);
}

export async function createStudent(payload: StudentInput) {
  return apiClient<Student>('/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStudent(id: string, payload: Partial<StudentInput>) {
  return apiClient<Student>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteStudent(id: string) {
  return apiClient<{ success: boolean; message: string }>(`/students/${id}`, {
    method: 'DELETE',
  });
}

export { AppApiError };