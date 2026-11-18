import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/app.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

const baseStudent = {
  name: 'Test Student',
  studentId: 'STU-9001',
  grade: '9',
  class: 'A',
  dateOfBirth: '2011-01-01',
  mealEligibility: 'paid',
  dietaryRestrictions: [],
  allergies: ['Peanuts'],
  status: 'Active',
};

describe('POST /api/students', () => {
  it('creates a student and returns 201 with the standard envelope', async () => {
    const res = await request(app).post('/api/students').send(baseStudent);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.studentId).toBe('STU-9001');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.message).toBe('Student created successfully');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ name: 'Only name' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 409 for duplicate studentId', async () => {
    await request(app).post('/api/students').send(baseStudent);
    const res = await request(app).post('/api/students').send(baseStudent);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/students', () => {
  beforeEach(async () => {
    await request(app).post('/api/students').send(baseStudent);
    await request(app).post('/api/students').send({
      ...baseStudent,
      studentId: 'STU-9002',
      name: 'Other Student',
      status: 'Inactive',
    });
  });

  it('returns a paginated list without sensitive fields', async () => {
    const res = await request(app).get('/api/students?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 5,
      total: 2,
      totalPages: 1,
    });
    // Sensitive allergy/dietary data is excluded from list endpoints
    expect(res.body.data[0].allergies).toBeUndefined();
    expect(res.body.data[0].dietaryRestrictions).toBeUndefined();
  });

  it('searches by name or studentId', async () => {
    const res = await request(app).get('/api/students?search=STU-9001');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].studentId).toBe('STU-9001');
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/students?status=Inactive');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('Inactive');
  });

  it('sorts by createdAt descending by default', async () => {
    const res = await request(app).get('/api/students');
    expect(res.body.data[0].name).toBe('Other Student');
  });
});

describe('GET /api/students/:id', () => {
  let studentId;

  beforeEach(async () => {
    const res = await request(app).post('/api/students').send(baseStudent);
    studentId = res.body.data._id;
  });

  it('returns the full record including sensitive fields', async () => {
    const res = await request(app).get(`/api/students/${studentId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.allergies).toEqual(['Peanuts']);
    expect(res.body.data.dietaryRestrictions).toEqual([]);
  });

  it('returns 404 for a missing record', async () => {
    const res = await request(app).get(
      `/api/students/${new mongoose.Types.ObjectId().toHexString()}`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid ObjectId', async () => {
    const res = await request(app).get('/api/students/not-an-id');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
describe('PUT /api/students/:id', () => {
  let studentId;

  beforeEach(async () => {
    const res = await request(app).post('/api/students').send(baseStudent);
    studentId = res.body.data._id;
  });

  it('updates a student and returns 200', async () => {
    const res = await request(app)
      .put(`/api/students/${studentId}`)
      .send({ name: 'Updated Name', status: 'Inactive' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.status).toBe('Inactive');
  });

  it('returns 409 when changing to an existing studentId', async () => {
    await request(app)
      .post('/api/students')
      .send({ ...baseStudent, studentId: 'STU-9002' });
    const res = await request(app)
      .put(`/api/students/${studentId}`)
      .send({ studentId: 'STU-9002' });
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app)
      .put(`/api/students/${studentId}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/students/:id', () => {
  let studentId;

  beforeEach(async () => {
    const res = await request(app).post('/api/students').send(baseStudent);
    studentId = res.body.data._id;
  });

  it('deletes a student and returns 200', async () => {
    const res = await request(app).delete(`/api/students/${studentId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const check = await request(app).get(`/api/students/${studentId}`);
    expect(check.statusCode).toBe(404);
  });

  it('returns 404 when already deleted', async () => {
    await request(app).delete(`/api/students/${studentId}`);
    const res = await request(app).delete(`/api/students/${studentId}`);
    expect(res.statusCode).toBe(404);
  });
});