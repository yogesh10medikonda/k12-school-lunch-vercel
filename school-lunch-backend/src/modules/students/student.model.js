import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    grade: { type: String, required: [true, 'Grade is required'], trim: true },
    class: { type: String, required: [true, 'Class is required'], trim: true },
    dateOfBirth: { type: Date },
    mealEligibility: {
      type: String,
      enum: ['free', 'reduced', 'paid', 'not_eligible'],
      default: 'paid',
    },
    dietaryRestrictions: [{ type: String, trim: true }],
    allergies: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for list/search/sort performance
studentSchema.index({ name: 1 });
studentSchema.index({ studentId: 1, status: 1 });
studentSchema.index({ grade: 1, status: 1 });

export const Student = mongoose.model('Student', studentSchema);
export default Student;