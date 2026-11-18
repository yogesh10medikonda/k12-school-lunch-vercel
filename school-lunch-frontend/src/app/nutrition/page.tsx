'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Apple,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Search,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  MinusCircle,
  AlertCircle,
  Utensils,
  BookOpen,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FilterPanel } from '@/components/shared/filter-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ChartCard } from '@/components/shared/chart-card';
import { useToast } from '@/components/ui/toast';
import { useRole } from '@/lib/auth/roles';
import { AppApiError } from '@/lib/api-client';

import {
  useFoodItems,
  useFoodItem,
  useCreateFoodItem,
  useUpdateFoodItem,
  useDeleteFoodItem,
  useNutritionGuidelines,
  useNutritionGuideline,
  useCreateNutritionGuideline,
  useUpdateNutritionGuideline,
  useDeleteNutritionGuideline,
  useEvaluateMeal,
} from '@/features/nutrition/hooks';
import type {
  FoodItem,
  FoodItemInput,
  FoodItemMeta,
  NutritionGuideline,
  NutritionGuidelineInput,
  NutritionGuidelineMeta,
  EvaluateResponse,
  NutrientCompliance,
} from '@/features/nutrition/types';
import {
  foodItemSchema,
  nutritionGuidelineSchema,
  type FoodItemFormValues,
  type NutritionGuidelineFormValues,
} from '@/features/nutrition/schemas';

// ─── Default Form Values ──────────────────────────────────────────────────────

const DEFAULT_FOOD_VALUES: FoodItemFormValues = {
  name: '',
  servingSize: 100,
  servingUnit: 'g',
  calories: 0,
  protein: 0,
  carbohydrates: 0,
  fats: 0,
  fibre: 0,
  vitamins: {},
  minerals: {},
};

const DEFAULT_GUIDELINE_VALUES: NutritionGuidelineFormValues = {
  name: '',
  jurisdiction: '',
  gradeGroup: '',
  mealType: 'Lunch',
  limits: {
    calories: { min: undefined, max: undefined },
    protein: { min: undefined, max: undefined },
    carbohydrates: { min: undefined, max: undefined },
    fats: { min: undefined, max: undefined },
    fibre: { min: undefined, max: undefined },
    vitamins: {},
    minerals: {},
  },
};

const MEAL_TYPE_OPTIONS = [
  { label: 'Lunch', value: 'Lunch' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Snack', value: 'Snack' },
  { label: 'Supper', value: 'Supper' },
];

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

// ─── Compliance Indicator Component ───────────────────────────────────────────

function ComplianceBadge({ compliance }: { compliance?: NutrientCompliance }) {
  if (!compliance || compliance.status === 'no_limit') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>NO LIMIT</span>
      </span>
    );
  }

  if (compliance.status === 'met') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>MET</span>
      </span>
    );
  }

  if (compliance.status === 'below_minimum') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <ArrowDownCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>BELOW MIN</span>
      </span>
    );
  }

  if (compliance.status === 'above_maximum') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
        <ArrowUpCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>ABOVE MAX</span>
      </span>
    );
  }

  return null;
}

export default function NutritionPage() {
  const { hasPermission } = useRole();
  const toast = useToast();

  const [activeTab, setActiveTab] = React.useState<'food-items' | 'guidelines' | 'evaluate'>('food-items');

  // ─── Food Items State ────────────────────────────────────────────────────────
  const [foodSearch, setFoodSearch] = React.useState('');
  const [foodPage, setFoodPage] = React.useState(1);
  const [foodLimit] = React.useState(10);
  const [foodModalOpen, setFoodModalOpen] = React.useState(false);
  const [foodModalMode, setFoodModalMode] = React.useState<'create' | 'edit'>('create');
  const [foodEditId, setFoodEditId] = React.useState<string | null>(null);
  const [foodDeleteTarget, setFoodDeleteTarget] = React.useState<FoodItem | null>(null);

  const {
    register: foodRegister,
    handleSubmit: handleFoodSubmit,
    reset: resetFoodForm,
    setError: setFoodError,
    formState: { errors: foodErrors, isSubmitting: foodSubmitting },
  } = useForm<FoodItemFormValues>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: DEFAULT_FOOD_VALUES,
  });

  const {
    data: foodItemsData,
    isLoading: foodItemsLoading,
    error: foodItemsError,
  } = useFoodItems({
    page: foodPage,
    limit: foodLimit,
    search: foodSearch || undefined,
  });

  const foodItemDetailQuery = useFoodItem(foodEditId || undefined);
  const createFoodItemMutation = useCreateFoodItem();
  const updateFoodItemMutation = useUpdateFoodItem();
  const deleteFoodItemMutation = useDeleteFoodItem();

  const rawFoodItems = foodItemsData?.data;
  const foodItems: FoodItem[] = Array.isArray(rawFoodItems)
    ? (rawFoodItems as unknown as FoodItem[])
    : (foodItemsData?.data?.data ?? []);
  const foodMeta: FoodItemMeta | undefined =
    (foodItemsData as unknown as { meta?: FoodItemMeta })?.meta ?? foodItemsData?.data?.meta;

  const isFoodEmpty = foodItems.length === 0 && !foodItemsLoading;

  // ─── Guidelines State ────────────────────────────────────────────────────────
  const [guidelineSearch, setGuidelineSearch] = React.useState('');
  const [guidelinePage, setGuidelinePage] = React.useState(1);
  const [guidelineLimit] = React.useState(10);
  const [guidelineModalOpen, setGuidelineModalOpen] = React.useState(false);
  const [guidelineModalMode, setGuidelineModalMode] = React.useState<'create' | 'edit'>('create');
  const [guidelineEditId, setGuidelineEditId] = React.useState<string | null>(null);
  const [guidelineDeleteTarget, setGuidelineDeleteTarget] = React.useState<NutritionGuideline | null>(null);

  const {
    register: guidelineRegister,
    handleSubmit: handleGuidelineSubmit,
    reset: resetGuidelineForm,
    setError: setGuidelineError,
    formState: { errors: guidelineErrors, isSubmitting: guidelineSubmitting },
  } = useForm<NutritionGuidelineFormValues>({
    resolver: zodResolver(nutritionGuidelineSchema),
    defaultValues: DEFAULT_GUIDELINE_VALUES,
  });

  const {
    data: guidelinesData,
    isLoading: guidelinesLoading,
    error: guidelinesError,
  } = useNutritionGuidelines({
    page: guidelinePage,
    limit: guidelineLimit,
    search: guidelineSearch || undefined,
  });

  const guidelineDetailQuery = useNutritionGuideline(guidelineEditId || undefined);
  const createGuidelineMutation = useCreateNutritionGuideline();
  const updateGuidelineMutation = useUpdateNutritionGuideline();
  const deleteGuidelineMutation = useDeleteNutritionGuideline();

  const rawGuidelines = guidelinesData?.data;
  const guidelines: NutritionGuideline[] = Array.isArray(rawGuidelines)
    ? (rawGuidelines as unknown as NutritionGuideline[])
    : (guidelinesData?.data?.data ?? []);
  const guidelinesMeta: NutritionGuidelineMeta | undefined =
    (guidelinesData as unknown as { meta?: NutritionGuidelineMeta })?.meta ?? guidelinesData?.data?.meta;

  const isGuidelinesEmpty = guidelines.length === 0 && !guidelinesLoading;

  // ─── Evaluate State ──────────────────────────────────────────────────────────
  // Fetch lists for evaluator selectors
  const { data: allFoodItemsData } = useFoodItems({ limit: 100 });
  const allFoodItems: FoodItem[] = Array.isArray(allFoodItemsData?.data)
    ? (allFoodItemsData.data as unknown as FoodItem[])
    : (allFoodItemsData?.data?.data ?? []);

  const { data: allGuidelinesData } = useNutritionGuidelines({ limit: 100 });
  const allGuidelines: NutritionGuideline[] = Array.isArray(allGuidelinesData?.data)
    ? (allGuidelinesData.data as unknown as NutritionGuideline[])
    : (allGuidelinesData?.data?.data ?? []);

  const [evalGuidelineId, setEvalGuidelineId] = React.useState<string>('');
  const [evalMealItems, setEvalMealItems] = React.useState<Array<{ foodItemId: string; servings: number }>>([
    { foodItemId: '', servings: 1 },
  ]);
  const [evalResult, setEvalResult] = React.useState<EvaluateResponse | null>(null);

  const evaluateMutation = useEvaluateMeal();

  // ─── ToastRef Pattern in Effects to Prevent Toast Loops ──────────────────────
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  React.useEffect(() => {
    if (foodItemsError) {
      toastRef.current.error(
        'Failed to load food items',
        foodItemsError instanceof AppApiError
          ? foodItemsError.message
          : 'Unable to communicate with the lunch management server.'
      );
    }
  }, [foodItemsError]);

  React.useEffect(() => {
    if (guidelinesError) {
      toastRef.current.error(
        'Failed to load nutrition guidelines',
        guidelinesError instanceof AppApiError
          ? guidelinesError.message
          : 'Unable to communicate with the lunch management server.'
      );
    }
  }, [guidelinesError]);

  // ─── Food Item Form Reset when Editing ──────────────────────────────────────
  React.useEffect(() => {
    if (foodEditId && foodModalMode === 'edit' && foodItemDetailQuery.data?.data) {
      const fi = foodItemDetailQuery.data.data;
      resetFoodForm({
        name: fi.name,
        servingSize: fi.servingSize,
        servingUnit: fi.servingUnit,
        calories: fi.calories,
        protein: fi.protein,
        carbohydrates: fi.carbohydrates,
        fats: fi.fats,
        fibre: fi.fibre,
        vitamins: fi.vitamins || {},
        minerals: fi.minerals || {},
      });
    }
  }, [foodEditId, foodModalMode, foodItemDetailQuery.data?.data, resetFoodForm]);

  // ─── Guideline Form Reset when Editing ──────────────────────────────────────
  React.useEffect(() => {
    if (guidelineEditId && guidelineModalMode === 'edit' && guidelineDetailQuery.data?.data) {
      const g = guidelineDetailQuery.data.data;
      resetGuidelineForm({
        name: g.name,
        jurisdiction: g.jurisdiction,
        gradeGroup: g.gradeGroup,
        mealType: g.mealType,
        limits: {
          calories: { min: g.limits?.calories?.min, max: g.limits?.calories?.max },
          protein: { min: g.limits?.protein?.min, max: g.limits?.protein?.max },
          carbohydrates: { min: g.limits?.carbohydrates?.min, max: g.limits?.carbohydrates?.max },
          fats: { min: g.limits?.fats?.min, max: g.limits?.fats?.max },
          fibre: { min: g.limits?.fibre?.min, max: g.limits?.fibre?.max },
          vitamins: g.limits?.vitamins || {},
          minerals: g.limits?.minerals || {},
        },
      });
    }
  }, [guidelineEditId, guidelineModalMode, guidelineDetailQuery.data?.data, resetGuidelineForm]);

  // ─── Food Item Handlers ─────────────────────────────────────────────────────
  const openCreateFoodItem = () => {
    setFoodModalMode('create');
    setFoodEditId(null);
    resetFoodForm(DEFAULT_FOOD_VALUES);
    setFoodModalOpen(true);
  };

  const openEditFoodItem = (id: string) => {
    setFoodModalMode('edit');
    setFoodEditId(id);
    setFoodModalOpen(true);
  };

  const closeFoodModal = () => {
    setFoodModalOpen(false);
    setFoodEditId(null);
    setFoodModalMode('create');
    resetFoodForm(DEFAULT_FOOD_VALUES);
  };

  const onFoodSubmit = async (data: FoodItemFormValues) => {
    const payload: FoodItemInput = {
      name: data.name.trim(),
      servingSize: Number(data.servingSize),
      servingUnit: data.servingUnit.trim(),
      calories: Number(data.calories),
      protein: Number(data.protein),
      carbohydrates: Number(data.carbohydrates),
      fats: Number(data.fats),
      fibre: Number(data.fibre),
      vitamins: data.vitamins || {},
      minerals: data.minerals || {},
    };

    try {
      if (foodModalMode === 'create') {
        await createFoodItemMutation.mutateAsync(payload);
      } else if (foodEditId) {
        await updateFoodItemMutation.mutateAsync({ id: foodEditId, payload });
      }
      closeFoodModal();
    } catch (error) {
      if (error instanceof AppApiError) {
        if (error.statusCode === 400) {
          const fields = extractFieldErrors(error.details);
          const keys = Object.keys(fields);
          if (keys.length === 0) {
            toast.error('Invalid data', error.message);
            return;
          }
          keys.forEach((field) =>
            setFoodError(field as keyof FoodItemFormValues, {
              type: 'server',
              message: fields[field],
            })
          );
          return;
        }
        if (error.statusCode === 409) {
          setFoodError('name', {
            type: 'server',
            message: error.message || 'A food item with this name already exists.',
          });
          return;
        }
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested food item could not be found.');
          return;
        }
        toast.error('Server error', error.message || 'Something went wrong.');
        return;
      }
      toast.error('Network error', 'Unable to communicate with the lunch management server.');
    }
  };

  const executeFoodDelete = async () => {
    if (!foodDeleteTarget) return;
    try {
      await deleteFoodItemMutation.mutateAsync(foodDeleteTarget._id);
      setFoodDeleteTarget(null);
    } catch {
      // Handled in mutation onError
    }
  };

  // ─── Guideline Handlers ─────────────────────────────────────────────────────
  const openCreateGuideline = () => {
    setGuidelineModalMode('create');
    setGuidelineEditId(null);
    resetGuidelineForm(DEFAULT_GUIDELINE_VALUES);
    setGuidelineModalOpen(true);
  };

  const openEditGuideline = (id: string) => {
    setGuidelineModalMode('edit');
    setGuidelineEditId(id);
    setGuidelineModalOpen(true);
  };

  const closeGuidelineModal = () => {
    setGuidelineModalOpen(false);
    setGuidelineEditId(null);
    setGuidelineModalMode('create');
    resetGuidelineForm(DEFAULT_GUIDELINE_VALUES);
  };

  const onGuidelineSubmit = async (data: NutritionGuidelineFormValues) => {
    const payload: NutritionGuidelineInput = {
      name: data.name.trim(),
      jurisdiction: data.jurisdiction.trim(),
      gradeGroup: data.gradeGroup.trim(),
      mealType: data.mealType.trim(),
      limits: {
        calories: {
          min: data.limits?.calories?.min !== undefined ? Number(data.limits.calories.min) : undefined,
          max: data.limits?.calories?.max !== undefined ? Number(data.limits.calories.max) : undefined,
        },
        protein: {
          min: data.limits?.protein?.min !== undefined ? Number(data.limits.protein.min) : undefined,
          max: data.limits?.protein?.max !== undefined ? Number(data.limits.protein.max) : undefined,
        },
        carbohydrates: {
          min: data.limits?.carbohydrates?.min !== undefined ? Number(data.limits.carbohydrates.min) : undefined,
          max: data.limits?.carbohydrates?.max !== undefined ? Number(data.limits.carbohydrates.max) : undefined,
        },
        fats: {
          min: data.limits?.fats?.min !== undefined ? Number(data.limits.fats.min) : undefined,
          max: data.limits?.fats?.max !== undefined ? Number(data.limits.fats.max) : undefined,
        },
        fibre: {
          min: data.limits?.fibre?.min !== undefined ? Number(data.limits.fibre.min) : undefined,
          max: data.limits?.fibre?.max !== undefined ? Number(data.limits.fibre.max) : undefined,
        },
        vitamins: {},
        minerals: {},
      },
    };

    try {
      if (guidelineModalMode === 'create') {
        await createGuidelineMutation.mutateAsync(payload);
      } else if (guidelineEditId) {
        await updateGuidelineMutation.mutateAsync({ id: guidelineEditId, payload });
      }
      closeGuidelineModal();
    } catch (error) {
      if (error instanceof AppApiError) {
        if (error.statusCode === 400) {
          const fields = extractFieldErrors(error.details);
          const keys = Object.keys(fields);
          if (keys.length === 0) {
            toast.error('Invalid data', error.message);
            return;
          }
          keys.forEach((field) =>
            setGuidelineError(field as keyof NutritionGuidelineFormValues, {
              type: 'server',
              message: fields[field],
            })
          );
          return;
        }
        if (error.statusCode === 409) {
          setGuidelineError('name', {
            type: 'server',
            message: error.message || 'A nutrition guideline with this name already exists.',
          });
          return;
        }
        if (error.statusCode === 404) {
          toast.error('Not found', 'The requested guideline could not be found.');
          return;
        }
        toast.error('Server error', error.message || 'Something went wrong.');
        return;
      }
      toast.error('Network error', 'Unable to communicate with the lunch management server.');
    }
  };

  const executeGuidelineDelete = async () => {
    if (!guidelineDeleteTarget) return;
    try {
      await deleteGuidelineMutation.mutateAsync(guidelineDeleteTarget._id);
      setGuidelineDeleteTarget(null);
    } catch {
      // Handled in mutation onError
    }
  };

  // ─── Evaluate Meal Handlers ─────────────────────────────────────────────────
  const addMealItemRow = () => {
    setEvalMealItems((prev) => [...prev, { foodItemId: '', servings: 1 }]);
  };

  const removeMealItemRow = (index: number) => {
    setEvalMealItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMealItemRow = (index: number, field: 'foodItemId' | 'servings', value: string | number) => {
    setEvalMealItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRunEvaluation = async () => {
    if (!evalGuidelineId) {
      toast.error('Missing guideline', 'Please select a nutrition guideline to evaluate against.');
      return;
    }

    const validItems = evalMealItems.filter((item) => item.foodItemId && Number(item.servings) > 0);
    if (validItems.length === 0) {
      toast.error('Missing items', 'Please select at least one food item with valid servings.');
      return;
    }

    try {
      const res = await evaluateMutation.mutateAsync({
        guidelineId: evalGuidelineId,
        items: validItems.map((item) => ({
          foodItemId: item.foodItemId,
          servings: Number(item.servings),
        })),
      });
      setEvalResult(res);
      toast.success('Meal evaluation complete');
    } catch {
      // Error handled in useEvaluateMeal onError toast
    }
  };

  // ─── Chart Data Preparation ─────────────────────────────────────────────────
  const caloriesChartData = React.useMemo(() => {
    if (!evalResult) return [];
    const { totals, compliance } = evalResult;
    return [
      {
        name: 'Calories',
        Actual: totals.calories,
        'Min Target': compliance.calories?.min ?? 0,
        'Max Target': compliance.calories?.max ?? 0,
      },
    ];
  }, [evalResult]);

  const macrosChartData = React.useMemo(() => {
    if (!evalResult) return [];
    const { totals, compliance } = evalResult;
    return [
      {
        name: 'Protein (g)',
        Actual: totals.protein,
        'Min Target': compliance.protein?.min ?? 0,
        'Max Target': compliance.protein?.max ?? 0,
      },
      {
        name: 'Carbs (g)',
        Actual: totals.carbohydrates,
        'Min Target': compliance.carbohydrates?.min ?? 0,
        'Max Target': compliance.carbohydrates?.max ?? 0,
      },
      {
        name: 'Fats (g)',
        Actual: totals.fats,
        'Min Target': compliance.fats?.min ?? 0,
        'Max Target': compliance.fats?.max ?? 0,
      },
      {
        name: 'Fibre (g)',
        Actual: totals.fibre,
        'Min Target': compliance.fibre?.min ?? 0,
        'Max Target': compliance.fibre?.max ?? 0,
      },
    ];
  }, [evalResult]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Nutrition Management & Compliance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Nutritional analysis, guideline compliance checker, and macro breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'food-items' && hasPermission('manage_nutrition') && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateFoodItem}>
              Add Food Item
            </Button>
          )}
          {activeTab === 'guidelines' && hasPermission('configure_guidelines') && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateGuideline}>
              Add Guideline
            </Button>
          )}
        </div>
      </div>

      {/* View Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('food-items')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'food-items'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>Food Item Database</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guidelines')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'guidelines'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Nutrition Guidelines</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evaluate')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'evaluate'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Meal Evaluator</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 1: FOOD ITEM DATABASE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'food-items' && (
        <div className="space-y-4">
          <FilterPanel
            searchQuery={foodSearch}
            onSearchChange={(val) => {
              setFoodSearch(val);
              setFoodPage(1);
            }}
            searchPlaceholder="Search food items by name..."
            onResetFilters={() => {
              setFoodSearch('');
              setFoodPage(1);
            }}
          />

          <Card>
            <CardContent className="p-0">
              {foodItemsLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={6} columns={8} />
                </div>
              ) : isFoodEmpty ? (
                <EmptyState
                  icon={Apple}
                  title="No food items found"
                  description="No food items match the search query. Add a food item to start building your nutritional database."
                  actionLabel={hasPermission('manage_nutrition') ? 'Add Food Item' : undefined}
                  onAction={hasPermission('manage_nutrition') ? openCreateFoodItem : undefined}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                          Food Item Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                          Serving
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                          Calories
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                          Protein
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                          Carbs
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                          Fats
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                          Fibre
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {foodItems.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.servingSize} {item.servingUnit}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{item.calories} kcal</td>
                          <td className="px-4 py-3 text-right font-mono">{item.protein} g</td>
                          <td className="px-4 py-3 text-right font-mono">{item.carbohydrates} g</td>
                          <td className="px-4 py-3 text-right font-mono">{item.fats} g</td>
                          <td className="px-4 py-3 text-right font-mono">{item.fibre} g</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission('manage_nutrition') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditFoodItem(item._id)}
                                  aria-label={`Edit ${item.name}`}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {hasPermission('manage_nutrition') && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setFoodDeleteTarget(item)}
                                  aria-label={`Delete ${item.name}`}
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

                  {foodMeta && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        Showing{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min((foodPage - 1) * foodLimit + 1, foodMeta.total)}
                        </span>{' '}
                        to{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min(foodPage * foodLimit, foodMeta.total)}
                        </span>{' '}
                        of <span className="font-semibold text-slate-900">{foodMeta.total}</span> food items
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setFoodPage((p) => Math.max(p - 1, 1))}
                          disabled={foodPage === 1}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="px-2 font-medium">
                          Page {foodPage} of {foodMeta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setFoodPage((p) => Math.min(p + 1, foodMeta.totalPages))}
                          disabled={foodPage >= foodMeta.totalPages}
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
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 2: NUTRITION GUIDELINES
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'guidelines' && (
        <div className="space-y-4">
          <FilterPanel
            searchQuery={guidelineSearch}
            onSearchChange={(val) => {
              setGuidelineSearch(val);
              setGuidelinePage(1);
            }}
            searchPlaceholder="Search guidelines by name..."
            onResetFilters={() => {
              setGuidelineSearch('');
              setGuidelinePage(1);
            }}
          />

          <Card>
            <CardContent className="p-0">
              {guidelinesLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={4} columns={6} />
                </div>
              ) : isGuidelinesEmpty ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="No nutrition guidelines found"
                  description="No configurable nutrition guidelines configured. Add a guideline to specify minimum and maximum targets per nutrient."
                  actionLabel={hasPermission('configure_guidelines') ? 'Add Guideline' : undefined}
                  onAction={hasPermission('configure_guidelines') ? openCreateGuideline : undefined}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                          Guideline Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                          Jurisdiction
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                          Grade Group
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                          Meal Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                          Nutrient Target Limits
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {guidelines.map((g) => (
                        <tr key={g._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                          <td className="px-4 py-3 text-slate-600">{g.jurisdiction}</td>
                          <td className="px-4 py-3 text-slate-600">{g.gradeGroup}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                              {g.mealType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {g.limits?.calories && (g.limits.calories.min != null || g.limits.calories.max != null) && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  Cal: {g.limits.calories.min ?? '0'}–{g.limits.calories.max ?? '∞'}
                                </span>
                              )}
                              {g.limits?.protein && (g.limits.protein.min != null || g.limits.protein.max != null) && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  Prot: {g.limits.protein.min ?? '0'}–{g.limits.protein.max ?? '∞'}g
                                </span>
                              )}
                              {g.limits?.carbohydrates && (g.limits.carbohydrates.min != null || g.limits.carbohydrates.max != null) && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  Carb: {g.limits.carbohydrates.min ?? '0'}–{g.limits.carbohydrates.max ?? '∞'}g
                                </span>
                              )}
                              {g.limits?.fats && (g.limits.fats.min != null || g.limits.fats.max != null) && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  Fat: {g.limits.fats.min ?? '0'}–{g.limits.fats.max ?? '∞'}g
                                </span>
                              )}
                              {g.limits?.fibre && (g.limits.fibre.min != null || g.limits.fibre.max != null) && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  Fibre: {g.limits.fibre.min ?? '0'}–{g.limits.fibre.max ?? '∞'}g
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission('configure_guidelines') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditGuideline(g._id)}
                                  aria-label={`Edit ${g.name}`}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {hasPermission('configure_guidelines') && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setGuidelineDeleteTarget(g)}
                                  aria-label={`Delete ${g.name}`}
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

                  {guidelinesMeta && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        Showing{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min((guidelinePage - 1) * guidelineLimit + 1, guidelinesMeta.total)}
                        </span>{' '}
                        to{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min(guidelinePage * guidelineLimit, guidelinesMeta.total)}
                        </span>{' '}
                        of <span className="font-semibold text-slate-900">{guidelinesMeta.total}</span> guidelines
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setGuidelinePage((p) => Math.max(p - 1, 1))}
                          disabled={guidelinePage === 1}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="px-2 font-medium">
                          Page {guidelinePage} of {guidelinesMeta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setGuidelinePage((p) => Math.min(p + 1, guidelinesMeta.totalPages))}
                          disabled={guidelinePage >= guidelinesMeta.totalPages}
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
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 3: MEAL EVALUATOR & COMPLIANCE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'evaluate' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span>Meal Evaluation Setup</span>
              </CardTitle>
              <CardDescription>
                Select a nutrition guideline and build a meal with food items and servings to check compliance against targets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Guideline Selector */}
              <div className="space-y-1.5 max-w-md">
                <label className="block text-xs font-semibold text-slate-700">
                  Target Nutrition Guideline <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <Select
                  value={evalGuidelineId}
                  onChange={(e) => setEvalGuidelineId(e.target.value)}
                >
                  <option value="">Select a guideline...</option>
                  {allGuidelines.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.jurisdiction} • {g.gradeGroup} • {g.mealType})
                    </option>
                  ))}
                </Select>
                {allGuidelines.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No guidelines found. Please add a guideline first in the Guidelines tab.
                  </p>
                )}
              </div>

              {/* Food Items & Servings List */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Meal Food Items & Servings <span className="text-rose-500 ml-0.5">*</span>
                </label>

                <div className="space-y-2.5">
                  {evalMealItems.map((mealItem, index) => {
                    const selectedItemInfo = allFoodItems.find((fi) => fi._id === mealItem.foodItemId);
                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <Select
                            value={mealItem.foodItemId}
                            onChange={(e) => updateMealItemRow(index, 'foodItemId', e.target.value)}
                          >
                            <option value="">Select food item...</option>
                            {allFoodItems.map((fi) => (
                              <option key={fi._id} value={fi._id}>
                                {fi.name} ({fi.servingSize} {fi.servingUnit} • {fi.calories} kcal)
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 sm:w-56">
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={mealItem.servings}
                            onChange={(e) => updateMealItemRow(index, 'servings', parseFloat(e.target.value) || 0)}
                            placeholder="Servings"
                          />
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {selectedItemInfo ? `servings (${selectedItemInfo.servingUnit})` : 'servings'}
                          </span>
                        </div>

                        {evalMealItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeMealItemRow(index)}
                            aria-label="Remove item"
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={addMealItemRow}
                  >
                    Add Food Item
                  </Button>

                  <Button
                    type="button"
                    onClick={handleRunEvaluation}
                    isLoading={evaluateMutation.isPending}
                    loadingText="Evaluating…"
                    leftIcon={<Calculator className="w-4 h-4" />}
                  >
                    Evaluate Meal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluation Results Section */}
          {evalResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Guideline Banner */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Evaluated against: {evalResult.guideline.name}</span>
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Jurisdiction: <span className="font-semibold">{evalResult.guideline.jurisdiction}</span> • Grade Group:{' '}
                    <span className="font-semibold">{evalResult.guideline.gradeGroup}</span> • Meal Type:{' '}
                    <span className="font-semibold">{evalResult.guideline.mealType}</span>
                  </p>
                </div>
              </div>

              {/* Compliance Breakdown Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Nutrient Compliance & Targets</span>
                  </CardTitle>
                  <CardDescription>
                    Per-serving and total meal nutrients compared against the guideline minimum and maximum constraints.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                            Nutrient
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                            Total in Meal
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                            Per Serving (Avg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                            Guideline Target
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                            Compliance Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                            Explanation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {/* Calories */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">Calories</td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{evalResult.totals.calories} kcal</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">{evalResult.perServing.calories} kcal</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {evalResult.compliance.calories?.min ?? '0'} – {evalResult.compliance.calories?.max ?? '∞'} kcal
                          </td>
                          <td className="px-4 py-3">
                            <ComplianceBadge compliance={evalResult.compliance.calories} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{evalResult.compliance.calories?.message}</td>
                        </tr>

                        {/* Protein */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">Protein</td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{evalResult.totals.protein} g</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">{evalResult.perServing.protein} g</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {evalResult.compliance.protein?.min ?? '0'} – {evalResult.compliance.protein?.max ?? '∞'} g
                          </td>
                          <td className="px-4 py-3">
                            <ComplianceBadge compliance={evalResult.compliance.protein} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{evalResult.compliance.protein?.message}</td>
                        </tr>

                        {/* Carbohydrates */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">Carbohydrates</td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{evalResult.totals.carbohydrates} g</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">{evalResult.perServing.carbohydrates} g</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {evalResult.compliance.carbohydrates?.min ?? '0'} – {evalResult.compliance.carbohydrates?.max ?? '∞'} g
                          </td>
                          <td className="px-4 py-3">
                            <ComplianceBadge compliance={evalResult.compliance.carbohydrates} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{evalResult.compliance.carbohydrates?.message}</td>
                        </tr>

                        {/* Fats */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">Fats</td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{evalResult.totals.fats} g</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">{evalResult.perServing.fats} g</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {evalResult.compliance.fats?.min ?? '0'} – {evalResult.compliance.fats?.max ?? '∞'} g
                          </td>
                          <td className="px-4 py-3">
                            <ComplianceBadge compliance={evalResult.compliance.fats} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{evalResult.compliance.fats?.message}</td>
                        </tr>

                        {/* Fibre */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">Fibre</td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{evalResult.totals.fibre} g</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">{evalResult.perServing.fibre} g</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {evalResult.compliance.fibre?.min ?? '0'} – {evalResult.compliance.fibre?.max ?? '∞'} g
                          </td>
                          <td className="px-4 py-3">
                            <ComplianceBadge compliance={evalResult.compliance.fibre} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{evalResult.compliance.fibre?.message}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* ─── Recharts Bar Charts for Calories, Protein, Carbohydrates & Fats ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calories Chart */}
                <ChartCard
                  title="Energy Analysis: Calories (kcal)"
                  subtitle="Total meal energy compared against minimum and maximum targets"
                >
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={caloriesChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit=" kcal" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          formatter={(value) => [`${value} kcal`]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="Actual" fill="#059669" name="Actual Total" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Min Target" fill="#3b82f6" name="Min Target" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Max Target" fill="#f59e0b" name="Max Target" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Macronutrients Chart (Protein, Carbs, Fats) */}
                <ChartCard
                  title="Macronutrients Breakdown: Protein, Carbs & Fats (g)"
                  subtitle="Total grams compared against minimum and maximum targets"
                >
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={macrosChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit=" g" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          formatter={(value) => [`${value} g`]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="Actual" fill="#059669" name="Actual Total" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Min Target" fill="#3b82f6" name="Min Target" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Max Target" fill="#f59e0b" name="Max Target" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT FOOD ITEM
      ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={foodModalOpen}
        onClose={closeFoodModal}
        title={foodModalMode === 'create' ? 'Add Food Item' : 'Edit Food Item'}
        description={
          foodModalMode === 'create'
            ? 'Add a new food item to the nutritional database with standard serving macros.'
            : 'Update nutritional and serving metrics for this food item.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleFoodSubmit(onFoodSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Food Item Name <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <Input
              {...foodRegister('name')}
              placeholder="e.g. Whole Wheat Bread"
              error={foodErrors.name?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Serving Size <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                type="number"
                step="any"
                {...foodRegister('servingSize')}
                placeholder="e.g. 50"
                error={foodErrors.servingSize?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Serving Unit <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...foodRegister('servingUnit')}
                placeholder="e.g. g, slice, piece, ml"
                error={foodErrors.servingUnit?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Calories (kcal) <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                type="number"
                step="any"
                {...foodRegister('calories')}
                placeholder="0"
                error={foodErrors.calories?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Protein (g) <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                type="number"
                step="any"
                {...foodRegister('protein')}
                placeholder="0"
                error={foodErrors.protein?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Carbohydrates (g) <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                type="number"
                step="any"
                {...foodRegister('carbohydrates')}
                placeholder="0"
                error={foodErrors.carbohydrates?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Fats (g) <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                type="number"
                step="any"
                {...foodRegister('fats')}
                placeholder="0"
                error={foodErrors.fats?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Fibre (g) <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                type="number"
                step="any"
                {...foodRegister('fibre')}
                placeholder="0"
                error={foodErrors.fibre?.message}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={closeFoodModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={foodSubmitting}
              loadingText={foodModalMode === 'create' ? 'Adding…' : 'Saving…'}
              disabled={foodSubmitting}
            >
              {foodModalMode === 'create' ? 'Add Food Item' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT NUTRITION GUIDELINE
      ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={guidelineModalOpen}
        onClose={closeGuidelineModal}
        title={guidelineModalMode === 'create' ? 'Add Nutrition Guideline' : 'Edit Nutrition Guideline'}
        description={
          guidelineModalMode === 'create'
            ? 'Create a configurable nutrition standard. Min and Max constraints are data-driven.'
            : 'Update the nutrition standard limits and parameters.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleGuidelineSubmit(onGuidelineSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Guideline Name <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <Input
              {...guidelineRegister('name')}
              placeholder="e.g. Standard Elementary School Lunch"
              error={guidelineErrors.name?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Jurisdiction <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...guidelineRegister('jurisdiction')}
                placeholder="e.g. Federal / State"
                error={guidelineErrors.jurisdiction?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Grade Group <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Input
                {...guidelineRegister('gradeGroup')}
                placeholder="e.g. K-5, 6-8, 9-12"
                error={guidelineErrors.gradeGroup?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Meal Type <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <Select {...guidelineRegister('mealType')} error={guidelineErrors.mealType?.message}>
                {MEAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Configurable Nutrient Limits (Min / Max)
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Leave blank if no minimum or maximum limit applies. Limits are fully configurable and never hardcoded.
            </p>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {/* Calories */}
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Calories (kcal)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="Min kcal"
                  {...guidelineRegister('limits.calories.min')}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Max kcal"
                  {...guidelineRegister('limits.calories.max')}
                />
              </div>

              {/* Protein */}
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Protein (g)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="Min g"
                  {...guidelineRegister('limits.protein.min')}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Max g"
                  {...guidelineRegister('limits.protein.max')}
                />
              </div>

              {/* Carbohydrates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Carbohydrates (g)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="Min g"
                  {...guidelineRegister('limits.carbohydrates.min')}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Max g"
                  {...guidelineRegister('limits.carbohydrates.max')}
                />
              </div>

              {/* Fats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Fats (g)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="Min g"
                  {...guidelineRegister('limits.fats.min')}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Max g"
                  {...guidelineRegister('limits.fats.max')}
                />
              </div>

              {/* Fibre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Fibre (g)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="Min g"
                  {...guidelineRegister('limits.fibre.min')}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Max g"
                  {...guidelineRegister('limits.fibre.max')}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={closeGuidelineModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={guidelineSubmitting}
              loadingText={guidelineModalMode === 'create' ? 'Adding…' : 'Saving…'}
              disabled={guidelineSubmitting}
            >
              {guidelineModalMode === 'create' ? 'Add Guideline' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────────────
          CONFIRM DIALOGS
      ────────────────────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(foodDeleteTarget)}
        onClose={() => setFoodDeleteTarget(null)}
        onConfirm={executeFoodDelete}
        title="Delete Food Item"
        description={`Are you sure you want to delete "${foodDeleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Food Item"
        variant="danger"
        isLoading={deleteFoodItemMutation.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(guidelineDeleteTarget)}
        onClose={() => setGuidelineDeleteTarget(null)}
        onConfirm={executeGuidelineDelete}
        title="Delete Nutrition Guideline"
        description={`Are you sure you want to delete "${guidelineDeleteTarget?.name}"? Meals evaluated against this guideline will no longer reference it.`}
        confirmLabel="Delete Guideline"
        variant="danger"
        isLoading={deleteGuidelineMutation.isPending}
      />
    </div>
  );
}
