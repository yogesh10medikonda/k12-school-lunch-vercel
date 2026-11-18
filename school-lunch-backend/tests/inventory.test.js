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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseIngredient = {
  name: 'Tomatoes',
  category: 'Produce',
  unit: 'g',
  quantity: 1000,
  minStockLevel: 200,
  status: 'Active',
};

// ─── POST /api/inventory/ingredients ─────────────────────────────────────────

describe('POST /api/inventory/ingredients', () => {
  it('creates an ingredient and returns 201 with standard envelope', async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send(baseIngredient);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Tomatoes');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.message).toBe('Ingredient created successfully');
  });

  it('attaches computed stockStatus and expiryStatus', async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send(baseIngredient);
    expect(res.body.data.stockStatus).toBe('In Stock');
    expect(res.body.data.expiryStatus).toBeNull();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ unit: 'g', quantity: 100 });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 for invalid unit', async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, unit: 'kg' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for negative quantity', async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, quantity: -5 });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 for duplicate name (case-insensitive)', async () => {
    await request(app).post('/api/inventory/ingredients').send(baseIngredient);
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, name: 'TOMATOES' });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/inventory/ingredients ──────────────────────────────────────────

describe('GET /api/inventory/ingredients', () => {
  beforeEach(async () => {
    await request(app).post('/api/inventory/ingredients').send(baseIngredient);
    await request(app).post('/api/inventory/ingredients').send({
      ...baseIngredient,
      name: 'Carrots',
      category: 'Produce',
      quantity: 50,
      minStockLevel: 100,
      status: 'Inactive',
    });
    await request(app).post('/api/inventory/ingredients').send({
      name: 'Milk',
      category: 'Dairy',
      unit: 'ml',
      quantity: 0,
      minStockLevel: 500,
      status: 'Active',
    });
  });

  it('returns a paginated list with meta', async () => {
    const res = await request(app).get(
      '/api/inventory/ingredients?page=1&limit=5'
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 5, total: 3, totalPages: 1 });
  });

  it('searches by name', async () => {
    const res = await request(app).get(
      '/api/inventory/ingredients?search=carrot'
    );
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Carrots');
  });

  it('filters by category', async () => {
    const res = await request(app).get(
      '/api/inventory/ingredients?category=Dairy'
    );
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Milk');
  });

  it('filters by status=Inactive', async () => {
    const res = await request(app).get(
      '/api/inventory/ingredients?status=Inactive'
    );
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Carrots');
  });

  it('filters by availability=out_of_stock', async () => {
    const res = await request(app).get(
      '/api/inventory/ingredients?availability=out_of_stock'
    );
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Milk');
  });

  it('includes computed stockStatus in list', async () => {
    const res = await request(app).get('/api/inventory/ingredients');
    const names = res.body.data.map((d) => d.name);
    const tomatoes = res.body.data.find((d) => d.name === 'Tomatoes');
    const milk = res.body.data.find((d) => d.name === 'Milk');
    expect(tomatoes.stockStatus).toBe('In Stock');
    expect(milk.stockStatus).toBe('Out of Stock');
  });
});

// ─── GET /api/inventory/ingredients/:id ──────────────────────────────────────

describe('GET /api/inventory/ingredients/:id', () => {
  let ingredientId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send(baseIngredient);
    ingredientId = res.body.data._id;
  });

  it('returns the ingredient with computed fields', async () => {
    const res = await request(app).get(
      `/api/inventory/ingredients/${ingredientId}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Tomatoes');
    expect(res.body.data.stockStatus).toBeDefined();
  });

  it('returns 404 for a missing ingredient', async () => {
    const res = await request(app).get(
      `/api/inventory/ingredients/${new mongoose.Types.ObjectId().toHexString()}`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid ObjectId', async () => {
    const res = await request(app).get('/api/inventory/ingredients/not-an-id');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── PUT /api/inventory/ingredients/:id ──────────────────────────────────────

describe('PUT /api/inventory/ingredients/:id', () => {
  let ingredientId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send(baseIngredient);
    ingredientId = res.body.data._id;
  });

  it('updates an ingredient and returns 200', async () => {
    const res = await request(app)
      .put(`/api/inventory/ingredients/${ingredientId}`)
      .send({ status: 'Inactive', minStockLevel: 300 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('Inactive');
    expect(res.body.data.minStockLevel).toBe(300);
  });

  it('returns 409 when renaming to an existing name', async () => {
    await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, name: 'Carrots' });
    const res = await request(app)
      .put(`/api/inventory/ingredients/${ingredientId}`)
      .send({ name: 'Carrots' });
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app)
      .put(`/api/inventory/ingredients/${ingredientId}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for missing ingredient', async () => {
    const res = await request(app)
      .put(`/api/inventory/ingredients/${new mongoose.Types.ObjectId().toHexString()}`)
      .send({ status: 'Inactive' });
    expect(res.statusCode).toBe(404);
  });
});

// ─── DELETE /api/inventory/ingredients/:id ────────────────────────────────────

describe('DELETE /api/inventory/ingredients/:id', () => {
  let ingredientId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, quantity: 0, minStockLevel: 0 });
    ingredientId = res.body.data._id;
  });

  it('deletes an ingredient with no movements and returns 200', async () => {
    const res = await request(app).delete(
      `/api/inventory/ingredients/${ingredientId}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const check = await request(app).get(
      `/api/inventory/ingredients/${ingredientId}`
    );
    expect(check.statusCode).toBe(404);
  });

  it('returns 409 when ingredient has stock movements', async () => {
    await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-in`)
      .send({ quantity: 100, reason: 'delivery' });
    const res = await request(app).delete(
      `/api/inventory/ingredients/${ingredientId}`
    );
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/Inactive/);
  });

  it('returns 404 when already deleted', async () => {
    await request(app).delete(`/api/inventory/ingredients/${ingredientId}`);
    const res = await request(app).delete(
      `/api/inventory/ingredients/${ingredientId}`
    );
    expect(res.statusCode).toBe(404);
  });
});

// ─── POST /api/inventory/ingredients/:id/stock-in ────────────────────────────

describe('POST /api/inventory/ingredients/:id/stock-in', () => {
  let ingredientId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, quantity: 500 });
    ingredientId = res.body.data._id;
  });

  it('adds stock and creates a movement record', async () => {
    const res = await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-in`)
      .send({ quantity: 300, reason: 'weekly delivery' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.ingredient.quantity).toBe(800);
    expect(res.body.data.movement.type).toBe('IN');
    expect(res.body.data.movement.quantityBefore).toBe(500);
    expect(res.body.data.movement.quantityAfter).toBe(800);
  });

  it('returns 400 for zero quantity', async () => {
    const res = await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-in`)
      .send({ quantity: 0, reason: 'test' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for negative quantity', async () => {
    const res = await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-in`)
      .send({ quantity: -50, reason: 'test' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for missing ingredient', async () => {
    const res = await request(app)
      .post(
        `/api/inventory/ingredients/${new mongoose.Types.ObjectId().toHexString()}/stock-in`
      )
      .send({ quantity: 100, reason: 'delivery' });
    expect(res.statusCode).toBe(404);
  });
});

// ─── POST /api/inventory/ingredients/:id/stock-out ───────────────────────────

describe('POST /api/inventory/ingredients/:id/stock-out', () => {
  let ingredientId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, quantity: 500 });
    ingredientId = res.body.data._id;
  });

  it('deducts stock and creates a movement record', async () => {
    const res = await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-out`)
      .send({ quantity: 200, reason: 'kitchen use' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.ingredient.quantity).toBe(300);
    expect(res.body.data.movement.type).toBe('OUT');
    expect(res.body.data.movement.quantityBefore).toBe(500);
    expect(res.body.data.movement.quantityAfter).toBe(300);
  });

  it('returns 409 when requested quantity exceeds available stock', async () => {
    const res = await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-out`)
      .send({ quantity: 600, reason: 'kitchen use' });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Insufficient stock/);
  });

  it('prevents stock from going negative (concurrent overdraw scenario)', async () => {
    // Drain all stock first
    await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-out`)
      .send({ quantity: 500, reason: 'full depletion' });

    // Attempt to deduct from zero
    const res = await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-out`)
      .send({ quantity: 1, reason: 'overdraw attempt' });
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 for zero quantity', async () => {
    const res = await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-out`)
      .send({ quantity: 0, reason: 'test' });
    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /api/inventory/ingredients/:id/movements ────────────────────────────

describe('GET /api/inventory/ingredients/:id/movements', () => {
  let ingredientId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, quantity: 500 });
    ingredientId = res.body.data._id;
    await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-in`)
      .send({ quantity: 100, reason: 'delivery 1' });
    await request(app)
      .post(`/api/inventory/ingredients/${ingredientId}/stock-out`)
      .send({ quantity: 50, reason: 'kitchen' });
  });

  it('returns paginated movement history newest first', async () => {
    const res = await request(app).get(
      `/api/inventory/ingredients/${ingredientId}/movements?page=1&limit=10`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
    // newest first
    expect(res.body.data[0].type).toBe('OUT');
    expect(res.body.data[1].type).toBe('IN');
  });

  it('returns 404 when ingredient does not exist', async () => {
    const res = await request(app).get(
      `/api/inventory/ingredients/${new mongoose.Types.ObjectId().toHexString()}/movements`
    );
    expect(res.statusCode).toBe(404);
  });
});

// ─── GET /api/inventory/alerts ────────────────────────────────────────────────

describe('GET /api/inventory/alerts', () => {
  beforeEach(async () => {
    // In stock
    await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, quantity: 1000, minStockLevel: 200 });

    // Low stock (qty > 0 but <= min)
    await request(app)
      .post('/api/inventory/ingredients')
      .send({
        ...baseIngredient,
        name: 'Carrots',
        quantity: 50,
        minStockLevel: 200,
      });

    // Out of stock (qty === 0, also low stock threshold)
    await request(app)
      .post('/api/inventory/ingredients')
      .send({
        ...baseIngredient,
        name: 'Milk',
        unit: 'ml',
        quantity: 0,
        minStockLevel: 500,
      });

    // Expired
    await request(app)
      .post('/api/inventory/ingredients')
      .send({
        ...baseIngredient,
        name: 'Butter',
        unit: 'g',
        quantity: 200,
        minStockLevel: 50,
        expiryDate: '2020-01-01',
      });

    // Expiring soon (within 7 days)
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await request(app)
      .post('/api/inventory/ingredients')
      .send({
        ...baseIngredient,
        name: 'Cream',
        unit: 'ml',
        quantity: 300,
        minStockLevel: 50,
        expiryDate: soon,
      });
  });

  it('returns low-stock, expired, and expiringSoon arrays', async () => {
    const res = await request(app).get('/api/inventory/alerts');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.lowStock)).toBe(true);
    expect(Array.isArray(res.body.data.expired)).toBe(true);
    expect(Array.isArray(res.body.data.expiringSoon)).toBe(true);
  });

  it('reports Butter as expired', async () => {
    const res = await request(app).get('/api/inventory/alerts');
    const expiredNames = res.body.data.expired.map((i) => i.name);
    expect(expiredNames).toContain('Butter');
  });

  it('reports Cream as expiring soon', async () => {
    const res = await request(app).get('/api/inventory/alerts');
    const soonNames = res.body.data.expiringSoon.map((i) => i.name);
    expect(soonNames).toContain('Cream');
  });

  it('reports low-stock items (qty <= minStockLevel)', async () => {
    const res = await request(app).get('/api/inventory/alerts');
    const lowNames = res.body.data.lowStock.map((i) => i.name);
    expect(lowNames).toContain('Carrots');
    expect(lowNames).toContain('Milk');
  });

  it('respects custom days param', async () => {
    const res = await request(app).get('/api/inventory/alerts?days=1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.expiryWindowDays).toBe(1);
    // Cream expires in 3 days, so with days=1 it should NOT appear
    const soonNames = res.body.data.expiringSoon.map((i) => i.name);
    expect(soonNames).not.toContain('Cream');
  });
});

// ─── POST /api/inventory/availability-check ───────────────────────────────────

describe('POST /api/inventory/availability-check', () => {
  let tomId;
  let milkId;

  beforeEach(async () => {
    const tom = await request(app)
      .post('/api/inventory/ingredients')
      .send({ ...baseIngredient, quantity: 1000 });
    tomId = tom.body.data._id;

    const milk = await request(app)
      .post('/api/inventory/ingredients')
      .send({
        ...baseIngredient,
        name: 'Milk',
        unit: 'ml',
        quantity: 200,
      });
    milkId = milk.body.data._id;
  });

  it('returns sufficient=true when stock is adequate', async () => {
    const res = await request(app)
      .post('/api/inventory/availability-check')
      .send({
        items: [
          { ingredientId: tomId, requiredQuantity: 500 },
          { ingredientId: milkId, requiredQuantity: 100 },
        ],
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.allSufficient).toBe(true);
    expect(res.body.data.results[0].sufficient).toBe(true);
    expect(res.body.data.results[1].sufficient).toBe(true);
  });

  it('returns sufficient=false and correct missing quantity', async () => {
    const res = await request(app)
      .post('/api/inventory/availability-check')
      .send({
        items: [{ ingredientId: milkId, requiredQuantity: 500 }],
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.allSufficient).toBe(false);
    expect(res.body.data.results[0].sufficient).toBe(false);
    expect(res.body.data.results[0].missing).toBe(300);
    expect(res.body.data.results[0].available).toBe(200);
  });

  it('returns found=false for unknown ingredientId', async () => {
    const fakeId = new mongoose.Types.ObjectId().toHexString();
    const res = await request(app)
      .post('/api/inventory/availability-check')
      .send({ items: [{ ingredientId: fakeId, requiredQuantity: 10 }] });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.results[0].found).toBe(false);
    expect(res.body.data.allSufficient).toBe(false);
  });

  it('returns 400 for empty items array', async () => {
    const res = await request(app)
      .post('/api/inventory/availability-check')
      .send({ items: [] });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid ingredientId format', async () => {
    const res = await request(app)
      .post('/api/inventory/availability-check')
      .send({ items: [{ ingredientId: 'bad-id', requiredQuantity: 10 }] });
    expect(res.statusCode).toBe(400);
  });
});
