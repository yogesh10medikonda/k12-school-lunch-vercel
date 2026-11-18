# School Lunch Backend

Backend API for the K-12 School Lunch Nutrition & Inventory Management System (Next.js frontend at `C:\PROJECTS\school-lunch-system`).

## Stack

Node.js + Express, MongoDB + Mongoose, JavaScript (ES modules), dotenv, cors, nodemon, Zod, helmet, express-rate-limit, express-mongo-sanitize, morgan, Jest + Supertest.

## Folder structure

```
school-lunch-backend/
├── package.json, .env, .env.example, .gitignore, README.md, jest.config.js
├── src/
│   ├── server.js          # entry point: connects DB, starts server on PORT
│   ├── app.js             # Express app: middleware + routes
│   ├── config/            # env.js (Zod validation), db.js (mongoose connection)
│   ├── middleware/        # errorHandler, notFound, validate, asyncHandler, auth (stub)
│   ├── utils/             # ApiError, apiResponse, pagination, units
│   └── modules/            # students, vendors
│   │   ├── students/       # student.model.js, .validation.js, .service.js, .controller.js, .routes.js
│   │   └── vendors/        # vendor.model.js, vendorIngredient.model.js, .validation.js, .service.js,
│   │   │                   # .controller.js, .routes.js
├── scripts/seed.js        # dev-only demo data
└── tests/
    ├── students.test.js   # Supertest tests
    └── vendors.test.js    # Supertest tests
```

## Install & run

```powershell
# 1. Install dependencies
npm install

# 2. Copy environment file and adjust values
copy .env.example .env

# 3. Set MONGODB_URI in .env (e.g. your MongoDB Atlas cluster). Never commit .env.

# 4. Run dev server (nodemon) — you run this: npm run dev
npm run dev

# Production start
npm start

# Run tests

Jest loads ESM modules, so on Windows PowerShell you must enable VM modules:

```powershell
$env:NODE_OPTIONS='--experimental-vm-modules'
npm test
```

Tests use an in-memory MongoDB (mongodb-memory-server) — no credentials or running server needed.

```powershell
# Seed dev demo data (requires MONGODB_URI in .env)
npm run seed
```

Server listens on port **5000**; all routes are under `/api`. CORS is restricted to `FRONTEND_ORIGIN` (`http://localhost:3000` by default) — never `*`.

## Environment variables (`.env`)

| Variable | Example | Notes |
|---|---|---|
| PORT | 5000 | Server port |
| MONGODB_URI | mongodb://... | MongoDB connection string (secrets only in .env) |
| FRONTEND_ORIGIN | http://localhost:3000 | Allowed CORS origin |
| NODE_ENV | development | development / production / test |

`.env.example` contains placeholders. `.env` and `node_modules` are excluded via `.gitignore`.

## Response envelope (matches frontend `apiClient`)

Success: `{ success: true, data, message?, meta? }`
Error:   `{ success: false, message, errors? }`
Lists: query `page`, `limit`, `search`, `sort`; `meta = { page, limit, total, totalPages }`.

## Students API reference (Postman-ready)

Base URL: `http://localhost:5000/api/students` (auth stub allows all in development)

| # | Method | URL | Sample body | Expected |
|---|---|---|---|---|
| 1 | POST | /api/students | `{ "name": "Ava Johnson", "studentId": "STU-1001", "grade": "9", "class": "A", "dateOfBirth": "2011-03-14", "mealEligibility": "paid", "dietaryRestrictions": [], "allergies": ["Peanuts"], "status": "Active" }` | 201 created |
| 2 | GET | /api/students?page=1&limit=10&search=ava&status=Active | — | 200 list + meta |
| 3 | GET | /api/students/:id | — | 200 full record (incl. allergies/dietary) |
| 4 | PUT | /api/students/:id | `{ "name": "Ava J.", "status": "Inactive" }` | 200 updated |
| 5 | DELETE | /api/students/:id | — | 200 deleted |

Error cases: duplicate `studentId` → **409**; invalid ObjectId → **400**; missing record → **404**; validation failure → **400**.

### Notes on list endpoint
Allergy and dietary data is sensitive, so `GET /api/students` (list) excludes `allergies` and `dietaryRestrictions`; `GET /api/students/:id` (detail) returns them.

## Frontend integration

Call these endpoints from the students page:

- **Frontend page:** `src/app/students/page.tsx`
- **Frontend service:** `src/features/students/api/index.ts` — implement fetch functions there using `apiClient` from `@/lib/api-client` (base URL `http://localhost:5000/api`) and enable the real backend by setting `NEXT_PUBLIC_USE_MOCKS=false` / `NEXT_PUBLIC_API_URL`.

Example service functions to add in `src/features/students/api/index.ts`:

```ts
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/lib/api-client';

export const fetchStudents = (params?: { page?: number; limit?: number; search?: string; status?: string; grade?: string }) =>
  apiClient('/api/students', { params });

export const createStudent = (payload: unknown) =>
  apiClient('/api/students', { method: 'POST', body: JSON.stringify(payload) });
```

## Scripts

- `npm run dev` — nodemon on `src/server.js`
- `npm start` — production start
- `npm test` — Jest + Supertest (uses an in-memory MongoDB, no credentials needed)
- `npm run seed` — dev-only demo students (requires MONGODB_URI)

## Vendors API reference (Postman-ready)

Base URL: `http://localhost:5000/api/vendors` (auth stub allows all in development)

| # | Method | URL | Sample body | Expected |
|---|---|---|---|---|
| 1 | POST | /api/vendors | `{ "name": "Fresh Foods Co.", "contactPerson": "Alex Rivera", "email": "alex@freshfoods.example", "phone": "555-0101", "address": "123 Market St", "status": "Active", "rating": 4, "notes": "Primary produce supplier" }` | 201 created |
| 2 | GET | /api/vendors?page=1&limit=10&search=fresh&status=Active | — | 200 list + meta |
| 3 | GET | /api/vendors/:id | — | 200 vendor record |
| 4 | PUT | /api/vendors/:id | `{ "name": "Fresh Foods Co. Updated", "status": "Inactive" }` | 200 updated |
| 5 | DELETE | /api/vendors/:id | — | 200 deleted (409 if ingredient prices exist) |
| 6 | POST | /api/vendors/ingredients | `{ "vendor": "<vendorId>", "ingredient": "Tomatoes", "price": 2.5, "unit": "kg" }` | 200 saved (upsert) |
| 7 | GET | /api/vendors/:vendorId/ingredients | — | 200 ingredient price list |
| 8 | DELETE | /api/vendors/ingredients/:ingredientId | — | 200 removed |

Error cases: duplicate vendor name → **409**; invalid ObjectId → **400**; missing record → **404**; validation failure → **400**; deleting a vendor with ingredient prices → **409**.

### Vendor price catalog (VendorIngredient)
Vendor prices live in a separate `VendorIngredient` collection (`vendor`, `ingredient`, `price`, `unit`) to avoid circular references. `POST /api/vendors/ingredients` is idempotent: submitting the same vendor + ingredient updates the price rather than duplicating the row. A compound unique index on `{ vendor, ingredient }` enforces this.

## Frontend integration

Call these endpoints from the vendors page:

- **Frontend page:** `src/app/vendors/page.tsx`
- **Frontend service:** `src/features/vendors/api/index.ts` — implement fetch functions there using `apiClient` from `@/lib/api-client` (base URL `http://localhost:5000/api`) and enable the real backend by setting `NEXT_PUBLIC_USE_MOCKS=false` / `NEXT_PUBLIC_API_URL`.

Example service functions to add in `src/features/vendors/api/index.ts`:

```ts
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/lib/api-client';

export const fetchVendors = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => apiClient('/api/vendors', { params });

export const createVendor = (payload: unknown) =>
  apiClient('/api/vendors', { method: 'POST', body: JSON.stringify(payload) });

export const fetchVendorIngredients = (vendorId: string) =>
  apiClient(`/api/vendors/${vendorId}/ingredients`);

export const saveVendorIngredient = (payload: {
  vendor: string;
  ingredient: string;
  price: number;
  unit: string;
}) =>
  apiClient('/api/vendors/ingredients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
```