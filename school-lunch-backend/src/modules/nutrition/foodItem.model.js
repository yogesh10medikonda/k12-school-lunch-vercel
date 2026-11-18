import mongoose from 'mongoose';

/**
 * FoodItem — master food database for nutrition calculations.
 * Flexible vitamins/minerals as key-value pairs.
 */
const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    servingSize: {
      type: Number,
      required: [true, 'Serving size is required'],
      min: [0.01, 'Serving size must be positive'],
    },
    servingUnit: {
      type: String,
      required: [true, 'Serving unit is required'],
      trim: true,
    },
    calories: {
      type: Number,
      required: [true, 'Calories per serving is required'],
      min: [0, 'Calories cannot be negative'],
    },
    protein: {
      type: Number,
      required: [true, 'Protein per serving is required'],
      min: [0, 'Protein cannot be negative'],
    },
    carbohydrates: {
      type: Number,
      required: [true, 'Carbohydrates per serving is required'],
      min: [0, 'Carbohydrates cannot be negative'],
    },
    fats: {
      type: Number,
      required: [true, 'Fats per serving is required'],
      min: [0, 'Fats cannot be negative'],
    },
    fibre: {
      type: Number,
      required: [true, 'Fibre per serving is required'],
      min: [0, 'Fibre cannot be negative'],
    },
    vitamins: {
      type: Map,
      of: Number,
      default: {},
    },
    minerals: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

foodItemSchema.index({ name: 1 });

export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
export default FoodItem;