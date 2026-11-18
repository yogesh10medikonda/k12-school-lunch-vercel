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

const baseFoodItem = {
  name: 'Chicken Breast',
  servingSize: 100,
  servingUnit: 'g',
  calories: 165,
  protein: 31,
  carbohydrates: 0,
  fats: 3.6,
  fibre: 0,
  vitamins: { 'B12': 0.3, 'B6': 0.6 },
  minerals: { 'Iron': 1.0, 'Zinc': 1.0 },
};

const baseGuideline = {
  name: 'USDA School Lunch 9-12',
  jurisdiction: 'US',
  gradeGroup: '9-12',
  mealType: 'lunch',
  limits: {
    calories: { min: 750, max: 850 },
    protein: { min: 28, max: null },
    carbohydrates: { min: 100, max: 130 },
    fats: { min: 25, max: 35 },
    fibre: { min: 10, max: null },
    vitamins: { 'B12': { min: 1.2, max: null } },
    minerals: { 'Iron': { min: 8, max: null } },
  },
};

describe('POST /api/nutrition/food-items', () => {
  it('creates a food item and returns 201 with the standard envelope', async () => {
    const res = await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Chicken Breast');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.message).toBe('Food item created successfully');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/nutrition/food-items')
      .send({ name: 'Only name' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 409 for duplicate name', async () => {
    await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    const res = await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/nutrition/food-items', () => {
  beforeEach(async () => {
    await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    await request(app).post('/api/nutrition/food-items').send({
      ...baseFoodItem,
      name: 'Rice',
      servingSize: 100,
      servingUnit: 'g',
      calories: 130,
      protein: 2.7,
      carbohydrates: 28,
      fats: 0.3,
      fibre: 0.4,
    });
  });

  it('returns a paginated list', async () => {
    const res = await request(app).get('/api/nutrition/food-items?page=1&limit=5');
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
  });

  it('searches by name', async () => {
    const res = await request(app).get('/api/nutrition/food-items?search=Chicken');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Chicken Breast');
  });

  it('sorts by createdAt descending by default', async () => {
    const res = await request(app).get('/api/nutrition/food-items');
    expect(res.body.data[0].name).toBe('Rice');
  });
});

describe('GET /api/nutrition/food-items/:id', () => {
  let foodItemId;

  beforeEach(async () => {
    const res = await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    foodItemId = res.body.data._id;
  });

  it('returns the full record', async () => {
    const res = await request(app).get(`/api/nutrition/food-items/${foodItemId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Chicken Breast');
    expect(res.body.data.vitamins).toEqual({ 'B12': 0.3, 'B6': 0.6 });
  });

  it('returns 404 for a missing record', async () => {
    const res = await request(app).get(
      `/api/nutrition/food-items/${new mongoose.Types.ObjectId().toHexString()}`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid ObjectId', async () => {
    const res = await request(app).get('/api/nutrition/food-items/not-an-id');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/nutrition/food-items/:id', () => {
  let foodItemId;

  beforeEach(async () => {
    const res = await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    foodItemId = res.body.data._id;
  });

  it('updates a food item and returns 200', async () => {
    const res = await request(app)
      .put(`/api/nutrition/food-items/${foodItemId}`)
      .send({ name: 'Grilled Chicken', calories: 180 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Grilled Chicken');
    expect(res.body.data.calories).toBe(180);
  });

  it('returns 409 when changing to an existing name', async () => {
    await request(app)
      .post('/api/nutrition/food-items')
      .send({ ...baseFoodItem, name: 'Rice' });
    const res = await request(app)
      .put(`/api/nutrition/food-items/${foodItemId}`)
      .send({ name: 'Rice' });
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app)
      .put(`/api/nutrition/food-items/${foodItemId}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/nutrition/food-items/:id', () => {
  let foodItemId;

  beforeEach(async () => {
    const res = await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    foodItemId = res.body.data._id;
  });

  it('deletes a food item and returns 200', async () => {
    const res = await request(app).delete(`/api/nutrition/food-items/${foodItemId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const check = await request(app).get(`/api/nutrition/food-items/${foodItemId}`);
    expect(check.statusCode).toBe(404);
  });

  it('returns 404 when already deleted', async () => {
    await request(app).delete(`/api/nutrition/food-items/${foodItemId}`);
    const res = await request(app).delete(`/api/nutrition/food-items/${foodItemId}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/nutrition/guidelines', () => {
  it('creates a guideline and returns 201', async () => {
    const res = await request(app).post('/api/nutrition/guidelines').send(baseGuideline);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('USDA School Lunch 9-12');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.message).toBe('Nutrition guideline created successfully');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/nutrition/guidelines')
      .send({ name: 'Only name' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 for duplicate name', async () => {
    await request(app).post('/api/nutrition/guidelines').send(baseGuideline);
    const res = await request(app).post('/api/nutrition/guidelines').send(baseGuideline);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/nutrition/guidelines', () => {
  beforeEach(async () => {
    await request(app).post('/api/nutrition/guidelines').send(baseGuideline);
    await request(app).post('/api/nutrition/guidelines').send({
      ...baseGuideline,
      name: 'USDA School Breakfast 9-12',
      mealType: 'breakfast',
    });
  });

  it('returns a paginated list', async () => {
    const res = await request(app).get('/api/nutrition/guidelines?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('filters by mealType', async () => {
    const res = await request(app).get('/api/nutrition/guidelines?mealType=lunch');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].mealType).toBe('lunch');
  });

  it('filters by gradeGroup', async () => {
    const res = await request(app).get('/api/nutrition/guidelines?gradeGroup=9-12');
    expect(res.body.data.length).toBe(2);
  });
});

describe('POST /api/nutrition/evaluate', () => {
  let foodItemId1, foodItemId2, guidelineId;

  beforeEach(async () => {
    const fi1 = await request(app).post('/api/nutrition/food-items').send(baseFoodItem);
    foodItemId1 = fi1.body.data._id;

    const fi2 = await request(app).post('/api/nutrition/food-items').send({
      ...baseFoodItem,
      name: 'Brown Rice',
      servingSize: 100,
      servingUnit: 'g',
      calories: 111,
      protein: 2.6,
      carbohydrates: 23,
      fats: 0.9,
      fibre: 1.8,
      vitamins: { 'B12': 0 },
      minerals: { 'Iron': 0.4 },
    });
    foodItemId2 = fi2.body.data._id;

    const gl = await request(app).post('/api/nutrition/guidelines').send(baseGuideline);
    guidelineId = gl.body.data._id;
  });

  it('evaluates a meal and returns per-serving and total nutrients with compliance', async () => {
    const res = await request(app).post('/api/nutrition/evaluate').send({
      items: [
        { foodItemId: foodItemId1, servings: 1.5 },
        { foodItemId: foodItemId2, servings: 1.0 },
      ],
      guidelineId,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.perServing).toBeDefined();
    expect(res.body.data.totals).toBeDefined();
    expect(res.body.data.compliance).toBeDefined();

    // Check compliance structure
    expect(res.body.data.compliance.calories).toBeDefined();
    expect(res.body.data.compliance.protein).toBeDefined();
    expect(res.body.data.compliance.vitamins).toBeDefined();
    expect(res.body.data.compliance.minerals).toBeDefined();

    // Calories should be below minimum (750) with only ~360 calories
    expect(res.body.data.compliance.calories.status).toBe('below_minimum');
  });

  it('returns 400 for missing items', async () => {
    const res = await request(app).post('/api/nutrition/evaluate').send({
      items: [],
      guidelineId,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for non-existent food item', async () => {
    const res = await request(app).post('/api/nutrition/evaluate').send({
      items: [{ foodItemId: new mongoose.Types.ObjectId().toHexString(), servings: 1 }],
      guidelineId,
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for non-existent guideline', async () => {
    const res = await request(app).post('/api/nutrition/evaluate').send({
      items: [{ foodItemId: foodItemId1, servings: 1 }],
      guidelineId: new mongoose.Types.ObjectId().toHexString(),
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid ObjectId in items', async () => {
    const res = await request(app).post('/api/nutrition/evaluate').send({
      items: [{ foodItemId: 'not-an-id', servings: 1 }],
      guidelineId,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid servings', async () => {
    const res = await request(app).post('/api/nutrition/evaluate').send({
      items: [{ foodItemId: foodItemId1, servings: 0 }],
      guidelineId,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Guideline CRUD', () => {
  let guidelineId;

  beforeEach(async () => {
    const res = await request(app).post('/api/nutrition/guidelines').send(baseGuideline);
    guidelineId = res.body.data._id;
  });

  it('GET /guidelines/:id returns the guideline', async () => {
    const res = await request(app).get(`/api/nutrition/guidelines/${guidelineId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.limits.calories.min).toBe(750);
  });

  it('PUT /guidelines/:id updates the guideline', async () => {
    const res = await request(app)
      .put(`/api/nutrition/guidelines/${guidelineId}`)
      .send({ limits: { calories: { min: 800, max: 900 } } });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.limits.calories.min).toBe(800);
  });

  it('DELETE /guidelines/:id deletes the guideline', async () => {
    const res = await request(app).delete(`/api/nutrition/guidelines/${guidelineId}`);
    expect(res.statusCode).toBe(200);
    const check = await request(app).get(`/api/nutrition/guidelines/${guidelineId}`);
    expect(check.statusCode).toBe(404);
  });
});