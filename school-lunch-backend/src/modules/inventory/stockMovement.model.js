import mongoose from 'mongoose';

/**
 * StockMovement — append-only audit log of every quantity change.
 * No update or delete routes are exposed for this model.
 * quantityBefore and quantityAfter provide a full audit trail.
 */
const stockMovementSchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'Ingredient is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['IN', 'OUT', 'ADJUSTMENT'],
        message: 'Type must be IN, OUT, or ADJUSTMENT',
      },
      required: [true, 'Movement type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity must be positive'],
    },
    quantityBefore: {
      type: Number,
      required: true,
      min: [0, 'quantityBefore cannot be negative'],
    },
    quantityAfter: {
      type: Number,
      required: true,
      min: [0, 'quantityAfter cannot be negative'],
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    reference: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    // Movements are time-stamped; use createdAt only (no updatedAt needed).
    timestamps: { createdAt: true, updatedAt: false },
  }
);

stockMovementSchema.index({ ingredient: 1, createdAt: -1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export default StockMovement;
