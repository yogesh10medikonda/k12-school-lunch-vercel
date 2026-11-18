import mongoose from 'mongoose';

/**
 * Ingredient — master inventory item.
 * One base unit per ingredient: g (mass), ml (volume), or piece (count).
 * quantity is the current on-hand stock; stockStatus is a computed virtual.
 */
const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ['g', 'ml', 'piece'],
        message: 'Unit must be g, ml, or piece',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      min: [0, 'Minimum stock level cannot be negative'],
      default: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

ingredientSchema.index({ name: 1 });
ingredientSchema.index({ category: 1, status: 1 });
ingredientSchema.index({ status: 1, quantity: 1 });

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export default Ingredient;
