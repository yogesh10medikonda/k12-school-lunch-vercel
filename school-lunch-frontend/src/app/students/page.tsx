'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Users, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { FilterPanel } from '@/components/shared/filter-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/ui/toast';
import { useRole } from '@/lib/auth/roles';
import {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from '@/features/students/hooks';
import type { Student, StudentInput, StudentStatus } from '@/features/students/types';
import {
  studentSchema,
  splitList,
  type StudentFormValues,
} from '@/features/students/schemas';
import { AppApiError } from '@/features/students/api';

const GRADE_OPTIONS = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];
const CLASS_OPTIONS = ['A','B','C','D'];
const MEAL_ELIGIBILITY_OPTIONS = [
  { label: 'Free', value: 'free' },
  { label: 'Reduced', value: 'reduced' },
  { label: 'Paid', value: 'paid' },
  { label: 'Not eligible', value: 'not_eligible' },
];
const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const DEFAULT_VALUES: StudentFormValues = {
  name: '',
  studentId: '',
  grade: '',
  class: '',
  dateOfBirth: '',
  mealEligibility: 'paid',
  dietaryRestrictions: '',
  allergies: '',
  status: 'Active',
};

function extractFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(details)) {
    for (const d of details as { path?: string; field?: string; message: string }[]) {
      const key = (d.path ?? d.field ?? '').split('.').pop();
      if (key && !out[key]) out[key] = d.message;
    }
  } else if (details && typeof details === 'object') {
    for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
      out[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  return out;
}

export default function StudentsPage() {
  const { hasPermission } = useRole();
  const toast = useToast();

  const [filters, setFilters] = React.useState({
    search: '',
    grade: 'all',
    class: 'all',
    status: 'all',
    dietary: 'all',
  });
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'create' | 'edit'>('create');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = useStudents({
    page,
    limit,
    search: filters.search || undefined,
    grade: filters.grade === 'all' ? undefined : filters.grade,
    class: filters.class === 'all' ? undefined : filters.class,
    status: filters.status === 'all' ? undefined : (filters.status as StudentStatus),
    dietary: filters.dietary === 'all' ? undefined : filters.dietary,
  });

  const studentQuery = useStudent(editId || undefined);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  const students: Student[] = listData?.data?.data ?? [];
  const meta = listData?.data?.meta;

  const isEmpty = students.length === 0 && !listLoading;

  const toastRef = React.useRef(toast);
toastRef.current = toast;

React.useEffect(() => {
  if (listError) {
    toastRef.current.error(
      'Failed to load students',
      listError instanceof AppApiError
        ? listError.message
        : 'Unable to communicate with the lunch management server.'
    );
  }
}, [listError]);

  const setFiltersAndResetPage = React.useCallback(
    (next: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...next }));
      setPage(1);
    },
    []
  );

  const handleFilterChange = (key: string, value: string) => {
    setFiltersAndResetPage({ [key]: value });
  };

  const handleResetFilters = () => {
    setFiltersAndResetPage({
      search: '',
      grade: 'all',
      class: 'all',
      status: 'all',
      dietary: 'all',
    });
  };

  const openCreate = () => {
    setMode('create');
    setEditId(null);
    reset(DEFAULT_VALUES);
    setOpen(true);
  };

  const openEdit = (id: string) => {
    setMode('edit');
    setEditId(id);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setMode('create');
    reset(DEFAULT_VALUES);
  };

  React.useEffect(() => {
    if (editId && mode === 'edit' && studentQuery.data?.data) {
      const s = studentQuery.data.data;
      reset({
        name: s.name,
        studentId: s.studentId,
        grade: s.grade,
        class: s['class'],
        dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
        mealEligibility: s.mealEligibility,
        dietaryRestrictions: (s.dietaryRestrictions || []).join(', '),
        allergies: (s.allergies || []).join(', '),
        status: s.status,
      });
    }
  }, [editId, mode, studentQuery.data?.data, reset]);

  const handleSubmitError = React.useCallback(
    (error: unknown) => {
      if (error instanceof AppApiError) {
        if (error.statusCode === 400) {
          const fields = extractFieldErrors(error.details);
          const keys = Object.keys(fields);
          if (keys.length === 0) {
            toast.error('Invalid data', error.message);
            return;
          }
          keys.forEach((field) =>
            setError(field as keyof StudentFormValues, {
              type: 'server',
              message: fields[field],
            })
          );
          return;
        }
        if (error.statusCode === 409) {
          setError('studentId', {
            type: 'server',
            message: error.message || 'A student with this ID already exists.',
          });
          return;
        }
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested student could not be found.');
          return;
        }
        toast.error('Server error', error.message || 'Something went wrong.');
        return;
      }
      toast.error(
        'Network error',
        'Unable to communicate with the lunch management server.'
      );
    },
    [setError, toast]
  );

  const onSubmit = async (data: StudentFormValues) => {
    const payload: StudentInput = {
      name: data.name,
      studentId: data.studentId,
      grade: data.grade,
      class: data.class,
      dateOfBirth: data.dateOfBirth || undefined,
      mealEligibility: data.mealEligibility,
      dietaryRestrictions: splitList(data.dietaryRestrictions),
      allergies: splitList(data.allergies),
      status: data.status,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else if (editId) {
        await updateMutation.mutateAsync({ id: editId, payload });
      }
      closeModal();
    } catch (error) {
      handleSubmitError(error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete student "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // useDeleteStudent already shows the toast (404 / network).
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Student Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Maintain student rosters, allergy alerts, and meal eligibility programs.
          </p>
        </div>

        {hasPermission('manage_students') && (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Register Student
          </Button>
        )}
      </div>

      <FilterPanel
        searchQuery={filters.search}
        onSearchChange={(val) => setFiltersAndResetPage({ search: val })}
        searchPlaceholder="Search by student name or ID..."
        filters={[
          {
            key: 'grade',
            label: 'Grade',
            options: GRADE_OPTIONS.map((value) => ({
              label: `Grade ${value}`,
              value,
            })),
          },
          {
            key: 'class',
            label: 'Class',
            options: CLASS_OPTIONS.map((value) => ({
              label: `Class ${value}`,
              value,
            })),
          },
          {
            key: 'status',
            label: 'Status',
            options: STATUS_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            })),
          },
          {
            key: 'dietary',
            label: 'Dietary Flag',
            options: [
              { label: 'Vegetarian', value: 'veg' },
              { label: 'Gluten Free', value: 'gluten' },
              { label: 'Dairy Free', value: 'dairy' },
              { label: 'Nut Allergy', value: 'nuts' },
            ],
          },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      <Card>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} columns={7} />
            </div>
          ) : isEmpty ? (
            <EmptyState
              icon={Users}
              title="No students found"
              description="No students match the current filters. Try resetting filters or register a new student."
              actionLabel="Register Student"
              onAction={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Student ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Meal Eligibility
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {students.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {student.name}
                      </td>
                      <td className="px-4 py-3">{student.studentId}</td>
                      <td className="px-4 py-3">{student.grade}</td>
                      <td className="px-4 py-3">{student['class']}</td>
                      <td className="px-4 py-3">
                        {student.mealEligibility.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('manage_students') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(student._id)}
                              aria-label={`Edit ${student.name}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {hasPermission('manage_students') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(student._id, student.name)}
                              aria-label={`Delete ${student.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {meta && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    Showing{' '}
                    <span className="font-semibold text-slate-900">
                      {Math.min((page - 1) * limit + 1, meta.total)}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-slate-900">
                      {Math.min(page * limit, meta.total)}
                    </span>{' '}
                    of <span className="font-semibold text-slate-900">{meta.total}</span> students
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="px-2 font-medium">
                      Page {page} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setPage((p) => Math.min(p + 1, meta.totalPages))
                      }
                      disabled={page >= meta.totalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={open}
        onClose={closeModal}
        title={mode === 'create' ? 'Register Student' : 'Edit Student'}
        description={
          mode === 'create'
            ? 'Create a new student record. Allergy and dietary data is stored securely.'
            : 'Update the student record. Changes are saved to the backend.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Full name <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g. Ava Johnson"
                error={errors.name?.message}
              />
              {errors.name && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Student ID <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...register('studentId')}
                placeholder="e.g. STU-1001"
                error={errors.studentId?.message}
              />
              {errors.studentId && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.studentId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Grade <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Select {...register('grade')} error={errors.grade?.message}>
                <option value="" disabled>
                  Select grade
                </option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </Select>
              {errors.grade && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.grade.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Class <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Select {...register('class')} error={errors.class?.message}>
                <option value="" disabled>
                  Select class
                </option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </Select>
              {errors.class && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.class.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Date of birth
              </label>
              <Input
                {...register('dateOfBirth')}
                type="date"
                error={errors.dateOfBirth?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Meal eligibility
              </label>
              <Select
                {...register('mealEligibility')}
                error={errors.mealEligibility?.message}
              >
                {MEAL_ELIGIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Dietary restrictions
            </label>
            <p className="text-xs text-slate-500">
              Comma-separated, e.g. Vegetarian, Gluten-free
            </p>
            <Input
              {...register('dietaryRestrictions')}
              placeholder="e.g. Vegetarian, Halal"
              error={errors.dietaryRestrictions?.message}
            />
            {errors.dietaryRestrictions && (
              <p className="text-xs font-medium text-rose-600">
                {errors.dietaryRestrictions.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Allergies
            </label>
            <p className="text-xs text-slate-500">
              Comma-separated, e.g. Peanuts, Shellfish
            </p>
            <Input
              {...register('allergies')}
              placeholder="e.g. Peanuts, Tree nuts"
              error={errors.allergies?.message}
            />
            {errors.allergies && (
              <p className="text-xs font-medium text-rose-600">
                {errors.allergies.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Status
            </label>
            <Select {...register('status')} error={errors.status?.message}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText={
                mode === 'create' ? 'Registering…' : 'Saving…'
              }
              disabled={isSubmitting}
            >
              {mode === 'create' ? 'Register Student' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}