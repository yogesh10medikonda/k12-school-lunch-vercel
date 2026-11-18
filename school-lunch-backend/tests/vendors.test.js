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

const baseVendor = {
  name: 'Fresh Foods Co.',
  contactPerson: 'Alex Rivera',
  email: 'alex@freshfoods.example',
  phone: '555-0101',
  address: '123 Market St',
  status: 'Active',
  rating: 4,
  notes: 'Primary produce supplier',
};

const baseIngredient = {
  ingredient: 'Tomatoes',
  price: 2.50,
  unit: 'kg',
};

describe('POST /api/vendors', () => {
  it('creates a vendor and returns 201 with the standard envelope', async () => {
    const res = await request(app).post('/api/vendors').send(baseVendor);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Fresh Foods Co.');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.message).toBe('Vendor created successfully');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/vendors').send({ contactPerson: 'x' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 409 for duplicate vendor name', async () => {
    await request(app).post('/api/vendors').send(baseVendor);
    const res = await request(app).post('/api/vendors').send(baseVendor);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/vendors', () => {
  beforeEach(async () => {
    await request(app).post('/api/vendors').send(baseVendor);
    await request(app).post('/api/vendors').send({
      ...baseVendor,
      name: 'Best Bakery Ltd',
      status: 'Inactive',
    });
  });

  it('returns a paginated list with meta', async () => {
    const res = await request(app).get('/api/vendors?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 5, total: 2, totalPages: 1 });
  });

  it('searches by name or contact person', async () => {
    const res = await request(app).get('/api/vendors?search=Bakery');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Best Bakery Ltd');
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/vendors?status=Inactive');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('Inactive');
  });
});

describe('GET /api/vendors/:id', () => {
  let vendorId;

  beforeEach(async () => {
    const res = await request(app).post('/api/vendors').send(baseVendor);
    vendorId = res.body.data._id;
  });

  it('returns the vendor record', async () => {
    const res = await request(app).get(`/api/vendors/${vendorId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Fresh Foods Co.');
  });

  it('returns 404 for a missing record', async () => {
    const res = await request(app).get(
      `/api/vendors/${new mongoose.Types.ObjectId().toHexString()}`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid ObjectId', async () => {
    const res = await request(app).get('/api/vendors/not-an-id');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
describe('PUT /api/vendors/:id', () => {
  let vendorId;

  beforeEach(async () => {
    const res = await request(app).post('/api/vendors').send(baseVendor);
    vendorId = res.body.data._id;
  });

  it('updates a vendor and returns 200', async () => {
    const res = await request(app)
      .put(`/api/vendors/${vendorId}`)
      .send({ name: 'Fresh Foods Co. Updated', status: 'Inactive' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Fresh Foods Co. Updated');
    expect(res.body.data.status).toBe('Inactive');
  });

  it('returns 409 when changing to an existing name', async () => {
    await request(app).post('/api/vendors').send({ ...baseVendor, name: 'Other Vendor' });
    const res = await request(app)
      .put(`/api/vendors/${vendorId}`)
      .send({ name: 'Other Vendor' });
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 for empty update body', async () => {
    const res = await request(app).put(`/api/vendors/${vendorId}`).send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/vendors/:id', () => {
  let vendorId;

  beforeEach(async () => {
    const res = await request(app).post('/api/vendors').send(baseVendor);
    vendorId = res.body.data._id;
  });

  it('deletes a vendor and returns 200', async () => {
    const res = await request(app).delete(`/api/vendors/${vendorId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const check = await request(app).get(`/api/vendors/${vendorId}`);
    expect(check.statusCode).toBe(404);
  });

  it('returns 404 when already deleted', async () => {
    await request(app).delete(`/api/vendors/${vendorId}`);
    const res = await request(app).delete(`/api/vendors/${vendorId}`);
    expect(res.statusCode).toBe(404);
  });

  it('returns 409 when vendor has ingredient price records', async () => {
    await request(app)
      .post('/api/vendors/ingredients')
      .send({ vendor: vendorId, ...baseIngredient });
    const res = await request(app).delete(`/api/vendors/${vendorId}`);
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/vendors/ingredients (price catalog)', () => {
  let vendorId;

  beforeEach(async () => {
    const res = await request(app).post('/api/vendors').send(baseVendor);
    vendorId = res.body.data._id;
  });

  it('creates a vendor ingredient price and returns 200', async () => {
    const res = await request(app)
      .post('/api/vendors/ingredients')
      .send({ vendor: vendorId, ...baseIngredient });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.ingredient).toBe('Tomatoes');
    expect(res.body.data.price).toBe(2.5);
  });

  it('upserts instead of duplicating on repeated submission', async () => {
    await request(app)
      .post('/api/vendors/ingredients')
      .send({ vendor: vendorId, ...baseIngredient });
    const res = await request(app)
      .post('/api/vendors/ingredients')
      .send({ vendor: vendorId, ...baseIngredient, price: 3.00 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.price).toBe(3.0);
    const list = await request(app).get(`/api/vendors/${vendorId}/ingredients`);
    expect(list.body.data.length).toBe(1);
  });

  it('returns 404 when vendor does not exist', async () => {
    const res = await request(app)
      .post('/api/vendors/ingredients')
      .send({ vendor: new mongoose.Types.ObjectId().toHexString(), ...baseIngredient });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/vendors/:vendorId/ingredients', () => {
  let vendorId;

  beforeEach(async () => {
    const res = await request(app).post('/api/vendors').send(baseVendor);
    vendorId = res.body.data._id;
    await request(app)
      .post('/api/vendors/ingredients')
      .send({ vendor: vendorId, ...baseIngredient });
  });

  it('lists ingredient prices for a vendor', async () => {
    const res = await request(app).get(`/api/vendors/${vendorId}/ingredients`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].ingredient).toBe('Tomatoes');
  });
});

describe('DELETE /api/vendors/ingredients/:ingredientId', () => {
  let ingredientId;

  beforeEach(async () => {
    const vendorRes = await request(app).post('/api/vendors').send(baseVendor);
    const vendorId = vendorRes.body.data._id;
    const res = await request(app)
      .post('/api/vendors/ingredients')
      .send({ vendor: vendorId, ...baseIngredient });
    ingredientId = res.body.data._id;
  });

  it('deletes an ingredient price and returns 200', async () => {
    const res = await request(app).delete(`/api/vendors/ingredients/${ingredientId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const check = await request(app).delete(`/api/vendors/ingredients/${ingredientId}`);
    expect(check.statusCode).toBe(404);
  });

  it('returns 400 for invalid ingredient price ID', async () => {
    const res = await request(app).delete('/api/vendors/ingredients/not-an-id');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});