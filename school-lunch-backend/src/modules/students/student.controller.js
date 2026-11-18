import { asyncHandler } from '../../middleware/asyncHandler.js';
import { apiResponse } from '../../utils/apiResponse.js';
import * as studentService from './student.service.js';

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);
  return apiResponse(res, 201, {
    success: true,
    data: student,
    message: 'Student created successfully',
  });
});

export const listStudents = asyncHandler(async (req, res) => {
  const { data, meta } = await studentService.listStudents(req.query);
  return apiResponse(res, 200, {
    success: true,
    data,
    message: 'Students retrieved successfully',
    meta,
  });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: student,
    message: 'Student retrieved successfully',
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  return apiResponse(res, 200, {
    success: true,
    data: student,
    message: 'Student updated successfully',
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id);
  return apiResponse(res, 200, {
    success: true,
    data: null,
    message: 'Student deleted successfully',
  });
});