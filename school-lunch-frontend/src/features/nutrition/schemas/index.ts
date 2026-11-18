import { z } from 'zod';

export const foodItemSchema = z.object({
  name: z.string().trim().min(1, 'Food item name is required'),
  servingSize: z.coerce.number().min(0.01, 'Serving size must be positive'),
  servingUnit: z.string().trim().min(1, 'Serving unit is required'),
  calories: z.coerce.number().min(0, 'Calories cannot be negative'),
  protein: z.coerce.number().min(0, 'Protein cannot be negative'),
  carbohydrates: z.coerce.number().min(0, 'Carbohydrates cannot be negative'),
  fats: z.coerce.number().min(0, 'Fats cannot be negative'),
  fibre: z.coerce.number().min(0, 'Fibre cannot be negative'),
  vitamins: z.record(z.coerce.number().min(0)).optional().default({}),
  minerals: z.record(z.coerce.number().min(0)).optional().default({}),
});

export type FoodItemFormValues = z.infer<typeof foodItemSchema>;

const optionalNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().optional()
);

export const nutrientLimitSchema = z
  .object({
    min: optionalNumber,
    max: optionalNumber.nullable(),
  })
  .optional();

export const nutritionGuidelineSchema = z.object({
  name: z.string().trim().min(1, 'Guideline name is required'),
  jurisdiction: z.string().trim().min(1, 'Jurisdiction is required'),
  gradeGroup: z.string().trim().min(1, 'Grade group is required'),
  mealType: z.string().trim().min(1, 'Meal type is required'),
  limits: z
    .object({
      calories: nutrientLimitSchema,
      protein: nutrientLimitSchema,
      carbohydrates: nutrientLimitSchema,
      fats: nutrientLimitSchema,
      fibre: nutrientLimitSchema,
      vitamins: z.record(nutrientLimitSchema).optional().default({}),
      minerals: z.record(nutrientLimitSchema).optional().default({}),
    })
    .optional()
    .default({}),
});

export type NutritionGuidelineFormValues = z.infer<typeof nutritionGuidelineSchema>;

export const evaluateItemSchema = z.object({
  foodItemId: z.string().min(1, 'Food item is required'),
  servings: z.coerce.number().min(0.01, 'Servings must be positive'),
});

export const evaluateSchema = z.object({
  items: z.array(evaluateItemSchema).min(1, 'At least one food item is required'),
  guidelineId: z.string().min(1, 'Guideline is required'),
});

export type EvaluateFormValues = z.infer<typeof evaluateSchema>;
