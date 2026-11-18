import mongoose from 'mongoose';

/**
 * Vendor ingredient price catalog.
 * Lives in its own collection to avoid circular references between Vendor and Ingredient.
 * `ingredient` is stored as a name string for now; it can be migrated to a ref to the
 * Ingredient collection once the Inventory module (module 3) is built.
 */
const vendorIngredientSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor is required'],
      index: true,
    },
    ingredient: {
      type: String,
      required: [true, 'Ingredient is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    unit: { type: String, required: [true, 'Unit is required'], trim: true },
  },
  { timestamps: true }
);

// A vendor cannot list the same ingredient twice.
vendorIngredientSchema.index({ vendor: 1, ingredient: 1 }, { unique: true });

export const VendorIngredient = mongoose.model(
  'VendorIngredient',
  vendorIngredientSchema
);
export default VendorIngredient;