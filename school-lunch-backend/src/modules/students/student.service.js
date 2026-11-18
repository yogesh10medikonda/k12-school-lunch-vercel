import { Student } from './student.model.js';
import { getPagination, getMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

// List projection excludes sensitive allergy/dietary data; those fields are
// returned only by the detail endpoint (GET /:id).
const LIST_FIELDS =
  'name studentId grade class mealEligibility status createdAt updatedAt';

export const createStudent = async (data) => {
  const existing = await Student.findOne({ studentId: data.studentId }).lean();
  if (existing) {
    throw new ApiError(
      409,
      `Student with studentId "${data.studentId}" already exists`
    );
  }
  const student = await Student.create(data);
  return student.toObject ? student.toObject() : student;
};

export const listStudents = async (query) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const filter = {};

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [{ name: regex }, { studentId: regex }];
  }
  if (query.grade) filter.grade = query.grade;
  if (query.class) filter.class = query.class;
  if (query.status) filter.status = query.status;
  if (query.mealEligibility) filter.mealEligibility = query.mealEligibility;
  if (query.dietary)
    filter.dietaryRestrictions = query.dietary;

  const sort = {};
  if (query.sort) {
    const field = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    const order = query.sort.startsWith('-') ? -1 : 1;
    sort[field] = order;
  } else {
    sort.createdAt = -1;
  }

  const [students, total] = await Promise.all([
    Student.find(filter)
      .select(LIST_FIELDS)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return { data: students, meta: getMeta(page, limit, total) };
};

export const getStudentById = async (id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(400, 'Invalid student ID format');
  const student = await Student.findById(id).lean();
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
};

export const updateStudent = async (id, data) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(400, 'Invalid student ID format');
  if (data.studentId) {
    const existing = await Student.findOne({
      studentId: data.studentId,
      _id: { $ne: id },
    }).lean();
    if (existing) {
      throw new ApiError(
        409,
        `Student with studentId "${data.studentId}" already exists`
      );
    }
  }
  const student = await Student.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
};

export const deleteStudent = async (id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(400, 'Invalid student ID format');
  const student = await Student.findByIdAndDelete(id).lean();
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
};