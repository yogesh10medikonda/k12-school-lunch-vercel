import mongoose from 'mongoose';

/**
 * NutritionGuideline — fully configurable nutrient limits per guideline.
 * No hardcoded country-specific values; all limits are data-driven.
 */
const nutritionGuidelineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Guideline name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    jurisdiction: {
      type: String,
      required: [true, 'Jurisdiction is required'],
      trim: true,
    },
    gradeGroup: {
      type: String,
      required: [true, 'Grade group is required'],
      trim: true,
    },
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      trim: true,
    },
    // Min/max limits per nutrient (all optional for flexibility)
    limits: {
      calories: { min: Number, max: Number },
      protein: { min: Number, max: Number },
      carbohydrates: { min: Number, max: Number },
      fats: { min: Number, max: Number },
      fibre: { min: Number, max: Number },
      // Vitamins and minerals as flexible key-value
      vitamins: {
        type: Map,
        of: { min: Number, max: Number },
        default: {},
      },
      minerals: {
        type: Map,
        of: { min: Number, max: Number },
        default: {},
      },
    },
  },
  { timestamps: true }
);

nutritionGuidelineSchema.index({ name: 1 });
nutritionGuidelineSchema.index({ jurisdiction: 1, gradeGroup: 1, mealType: 1 });

export const NutritionGuideline = mongoose.model('NutritionGuideline', nutritionGuidelineSchema);
export default NutritionGuideline;