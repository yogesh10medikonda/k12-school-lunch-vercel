import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
} from '@/features/students/api';
import type { ListStudentsParams, Student, StudentInput } from '@/features/students/types';
import { useToast } from '@/components/ui/toast';
import { AppApiError } from '@/lib/api-client';

export const studentsKeys = {
  all: ['students'] as const,
  list: (params: ListStudentsParams) =>
    [...studentsKeys.all, 'list', params] as const,
  detail: (id: string) => [...studentsKeys.all, 'detail', id] as const,
};

/** List query with server-side pagination, search, and filters. */
export function useStudents(params: ListStudentsParams = {}) {
  return useQuery({
    queryKey: studentsKeys.list(params),
    queryFn: () => listStudents(params),
    placeholderData: (previousData) => previousData,
  });
}

/** Single student detail query. */
export function useStudent(id?: string) {
  return useQuery({
    queryKey: studentsKeys.detail(id ?? ''),
    queryFn: () => getStudentById(id!),
    enabled: Boolean(id),
  });
}

/**
 * Create student mutation.
 * On success: invalidate student queries + toast.
 * On error: 400/409 field errors and 404/network toasts are handled by the
 * caller via mutateAsync rejection so they can be shown next to the right fields.
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (payload: StudentInput) => {
      const res = await createStudent(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsKeys.all });
      toast.success('Student registered');
    },
    onError: () => {
      // Intentional no-op: the caller handles 400/409 as field errors and
      // 404/network as toasts via mutateAsync rejection.
    },
  } as UseMutationOptions<Student, unknown, StudentInput>);
}

/**
 * Update student mutation.
 * On success: invalidate student queries + toast.
 * On error: handled by the caller via mutateAsync rejection.
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StudentInput>;
    }) => {
      const res = await updateStudent(id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsKeys.all });
      toast.success('Student updated');
    },
    onError: () => {
      // Intentional no-op: the caller handles errors via mutateAsync rejection.
    },
  } as UseMutationOptions<Student, unknown, { id: string; payload: Partial<StudentInput> }>);
}

/**
 * Delete student mutation.
 * On success: invalidate student queries + toast.
 * On error: 404 and network failures are shown as toasts.
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteStudent(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsKeys.all });
      toast.success('Student deleted');
    },
    onError: (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested student could not be found.');
          return;
        }
        toast.error('Request failed', error.message);
        return;
      }
      toast.error(
        'Network error',
        'Unable to communicate with the lunch management server.'
      );
    },
  } as UseMutationOptions<{ success: boolean; message: string }, unknown, string>);
}
