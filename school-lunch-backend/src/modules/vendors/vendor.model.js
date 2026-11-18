import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

vendorSchema.index({ status: 1, name: 1 });

export const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;