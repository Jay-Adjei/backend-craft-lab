# Postman Manual Testing Guide

Use this guide to **manually verify each lab task in Postman** before running the automated Jest suite for that level.

The requests below map 1:1 to what the integration tests assert. If Postman looks right, `npm test` for that level should pass.

---

## One-time setup

### 1. Start the API

```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Default base URL: `http://localhost:3000/api`

### 2. Create a Postman Environment

Create an environment named **Backend Craft Lab** with these variables:

| Variable | Initial value | Notes |
|----------|---------------|-------|
| `baseUrl` | `http://localhost:3000/api` | All requests use `{{baseUrl}}` |
| `adminToken` | *(empty)* | Set after admin login |
| `customerToken` | *(empty)* | Set after customer login |
| `productId` | *(empty)* | Copy from `GET /products` response |
| `inventoryId` | *(empty)* | Copy from `GET /inventory` response |

### 3. Seeded accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lab.local` | `Admin123!` |
| Customer | `customer@lab.local` | `Customer123!` |

### 4. Postman tips

- **JSON body:** set header `Content-Type: application/json`
- **Auth:** for protected routes, add header `Authorization: Bearer {{adminToken}}` (or `customerToken`)
- **Save tokens:** after login, copy `accessToken` from the response into your environment variable
- **Tests tab (optional):** you can add Postman tests like `pm.test("status", () => pm.response.to.have.status(404))` to mirror Jest

### 5. Recommended order

Complete tasks in the order below. Later tasks depend on earlier ones (especially Level 2 auth before admin routes behave correctly).

---

## Level 1 — Before `npm test -- tests/level1.test.js`

**Goal:** routing works, errors return clean JSON, validation rejects bad input, inventory CRUD returns real data.

---

### Task 1.1 — Centralized error handler

**File:** `src/middleware/errorHandler.js`

You are implementing three branches: `ZodError` → 400, `AppError` → its status, everything else → 500.

#### Request A — Generic 500 (plain `Error`)

Triggers the **fallback 500** branch. No auth required.

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/inventory/boom` |
| Headers | none |

**Before (broken lab):**

```json
HTTP 500
{
  "error": "Unhandled error (error handler incomplete)"
}
```

**After (done):** still `500`, but `error` should describe the thrown message (e.g. `"Intentional explosion for error-handler lab"`), not the generic incomplete stub.

**Pass signal:** JSON response, server keeps running, status `500`.

---

#### Request B — 404 via `AppError` (not a special route)

Unknown routes hit `notFoundHandler`, which calls `next(new AppError(..., 404))`. Your error handler must **forward** `AppError.statusCode`.

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/does-not-exist` |
| Headers | none |

**Before (broken lab):**

```json
HTTP 500
{
  "error": "Unhandled error (error handler incomplete)"
}
```

**After (done):**

```json
HTTP 404
{
  "error": "Route not found: GET /api/does-not-exist"
}
```

**Pass signal:** status is **404**, not 500.

---

#### Request C — Sanity check (always works)

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/health` |

**Expected (always):**

```json
HTTP 200
{ "status": "ok", "service": "backend-craft-lab" }
```

---

### Task 1.2 — Zod request validation

**File:** `src/middleware/validate.js`

Wire `schema.parse(req.body)` and pass validation errors to `next(err)` so Task 1.1 formats them as 400.

**Prerequisite:** log in as admin and save token (auth may still be broken on a fresh lab — if `POST /inventory` returns 501 without checking body, complete Task 1.2 first, then re-test after Task 2.1).

#### Step — Admin login (for inventory POST)

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/login` |
| Body (raw JSON) | see below |

```json
{
  "email": "admin@lab.local",
  "password": "Admin123!"
}
```

Copy `accessToken` → environment variable `adminToken`.

#### Request — Invalid inventory payload

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/inventory` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body (raw JSON) | `{ "quantity": -5 }` |

**Before (broken lab):** validation skipped → request reaches controller → likely `501` or other non-400 response.

**After (done):**

```json
HTTP 400
{
  "error": "Validation failed",
  "details": [
    { "path": "quantity", "message": "..." }
  ]
}
```

**Pass signal:** status **400**, `error` contains `"Validation failed"`.

---

### Task 1.3 — Inventory create (service)

**File:** `src/services/inventory.service.js` → `createInventoryItem`

#### Request — Create product + inventory

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/inventory` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body (raw JSON) | see below |

```json
{
  "name": "Lab Keyboard",
  "sku": "KB-100",
  "price": 79.99,
  "category": "Electronics",
  "quantity": 25,
  "location": "C-1"
}
```

**Before (broken lab):**

```json
HTTP 501
{ "error": "Not implemented: create inventory" }
```

**After (done):**

```json
HTTP 201
```

Response includes `quantity: 25` and `sku: "KB-100"` (either on the root object or nested under `product`).

**Pass signal:** status **201**, data persisted (confirm with Task 1.4 list).

---

### Task 1.4 — Inventory list (service)

**File:** `src/services/inventory.service.js` → `listInventoryItems`

#### Request — List all inventory

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/inventory` |
| Headers | none |

**Before (broken lab):**

```json
HTTP 200
{ "items": [] }
```

(even though seeded products exist in the DB)

**After (done):**

```json
HTTP 200
{
  "items": [
    {
      "id": "...",
      "quantity": 50,
      "product": {
        "name": "Wireless Mouse",
        "sku": "WM-001",
        ...
      }
    },
    ...
  ]
}
```

**Pass signal:** `items` is a non-empty array; each item has a nested `product` object.

---

### Task 1.5 — Inventory controller wiring

**File:** `src/controllers/inventory.controller.js`

Replace `501` / empty-array stubs with calls to the service you built in Tasks 1.3–1.4.

Re-run **Task 1.3** and **Task 1.4** requests. They should still pass. If the service works but the controller still returns stubs, fix the controller.

---

### Level 1 checkpoint

```bash
npm test -- tests/level1.test.js
```

Expected: **6/6 passing**

| Postman request | Proves |
|-----------------|--------|
| `GET /health` | Server boots |
| `GET /inventory/boom` | Generic 500 branch |
| `GET /does-not-exist` | `AppError` / 404 branch |
| `POST /inventory` invalid body | Zod → 400 branch |
| `POST /inventory` valid body | Create works |
| `GET /inventory` | List with `product` relation |

---

## Level 2 — Before `npm test -- tests/level2.test.js`

**Goal:** JWT auth on protected routes, RBAC blocks customers from admin actions.

**Prerequisite:** Level 1 complete (especially error handler + validation).

---

### Task 2.1 — JWT auth middleware

**File:** `src/middleware/auth.js` → `authMiddleware`

Extract `Bearer <token>`, verify with `verifyAccessToken`, set `req.user`, handle expired tokens.

#### Request A — No token (should fail)

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/auth/me` |
| Headers | none |

**Before (broken lab):** `200` with empty/missing user (auth bypassed).

**After (done):**

```json
HTTP 401
{ "error": "Authentication required" }
```

---

#### Request B — Valid token (should succeed)

1. Login as customer:

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/login` |
| Body | `{ "email": "customer@lab.local", "password": "Customer123!" }` |

Save `accessToken` → `customerToken`.

2. Call `/auth/me`:

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/auth/me` |
| Headers | `Authorization: Bearer {{customerToken}}` |

**After (done):**

```json
HTTP 200
{
  "user": {
    "id": "...",
    "email": "customer@lab.local",
    "role": "CUSTOMER"
  }
}
```

---

#### Request C — Expired token (should fail)

In Postman you cannot easily mint an expired JWT without a pre-made token. Options:

- Run `npm test -- tests/level2.test.js` for the expired-token case, **or**
- Temporarily set `JWT_ACCESS_EXPIRES_IN=1s` in `.env`, login, wait 2 seconds, retry `/auth/me`

**After (done):**

```json
HTTP 401
{ "error": "Token expired" }
```

(or a message matching expired/invalid/auth)

---

### Task 2.2 — RBAC (`requireRole`)

**File:** `src/middleware/rbac.js`

Customers must get **403** on admin-only routes; admins must succeed.

#### Request A — Customer blocked from creating products

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/products` |
| Headers | `Authorization: Bearer {{customerToken}}` |
| Body | see below |

```json
{
  "name": "Nope",
  "sku": "NOPE-001",
  "price": 5,
  "quantity": 1
}
```

**Before (broken lab):** `201` (customer incorrectly allowed).

**After (done):**

```json
HTTP 403
{ "error": "Forbidden: insufficient permissions" }
```

---

#### Request B — Customer blocked from creating inventory

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/inventory` |
| Headers | `Authorization: Bearer {{customerToken}}` |
| Body | `{ "name": "Fail", "sku": "FAIL-1", "price": 1, "quantity": 1 }` |

**After (done):** `403` (not `501`).

---

#### Request C — Admin allowed to create products

Login as admin → save `adminToken`, then:

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/products` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body | `{ "name": "Admin Widget", "sku": "ADM-001", "price": 10, "quantity": 5 }` |

**After (done):** `201` with product + inventory in response.

---

### Task 2.3 — Auth flows (already implemented — sanity checks)

These work without TODOs; use them to confirm your environment is set up.

#### Register

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/register` |
| Body | `{ "email": "you@example.com", "password": "Password123!", "name": "You" }` |

**Expected:** `201`, `accessToken`, `refreshToken`, no `passwordHash` in response.

#### Refresh token rotation

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/refresh` |
| Body | `{ "refreshToken": "<paste refreshToken from login>" }` |

**Expected:** `200`, new `accessToken`, **different** `refreshToken` than before.

---

### Level 2 checkpoint

```bash
npm test -- tests/level2.test.js
```

Expected: **6/6 passing**

| Postman request | Proves |
|-----------------|--------|
| `GET /auth/me` no header | 401 |
| `GET /auth/me` with token | 200 + user |
| `POST /products` as customer | 403 |
| `POST /inventory` as customer | 403 |
| `POST /products` as admin | 201 |
| `POST /auth/refresh` | token rotation |

---

## Level 3 — Before `npm test -- tests/level3.test.js`

**Goal:** product pagination/search, transactional orders, stock integrity.

**Prerequisites:** Level 1 + Level 2 complete. Customer token for orders; admin token for image upload.

---

### Task 3.1 — Product pagination, search, filters

**File:** `src/services/product.service.js` → `listProducts`

Use seeded products (Wireless Mouse, USB-C Hub, Notebook Pack) or create a few via admin `POST /products`.

#### Request A — Pagination

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/products?page=1&limit=2&sortBy=name&sortOrder=asc` |

**Before (broken lab):** returns **all** products (e.g. 3 items), ignores `limit=2`.

**After (done):**

```json
HTTP 200
{
  "items": [ /* exactly 2 products */ ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 3,
    "totalPages": 2
  }
}
```

---

#### Request B — Search

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/products?search=Mouse` |

**After (done):** `items` length `1`, name contains `"Mouse"`.

---

#### Request C — Category + price filter

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/products?category=Electronics&minPrice=15&maxPrice=50` |

**After (done):** `items` length `1`, SKU `UCH-002` (USB-C Hub at $49.99).

---

#### Helper — Get a `productId` for orders

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `{{baseUrl}}/products` |

Copy any product `id` (e.g. Wireless Mouse) → environment variable `productId`.

Note seeded stock for Wireless Mouse: **quantity 50**.

---

### Task 3.2 — Transactional order creation

**File:** `src/services/order.service.js` → `createOrder`

Wrap payment check + stock deduction + order creation in `prisma.$transaction`. Check payment **before** mutating inventory.

#### Request A — Successful order

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/orders` |
| Headers | `Authorization: Bearer {{customerToken}}` |
| Body | see below |

```json
{
  "items": [
    { "productId": "{{productId}}", "quantity": 2 }
  ],
  "paymentStatus": "PAID"
}
```

**After (done):**

```json
HTTP 201
{
  "invoiceNumber": "INV-...",
  "totalAmount": 59.98,
  "items": [ ... ],
  "status": "PAID"
}
```

**Verify stock dropped:** `GET {{baseUrl}}/inventory` → find the product → quantity decreased by 2.

---

#### Request B — Failed payment must NOT deduct stock

1. Note current stock for a product (e.g. Notebook Pack, qty 100).
2. Send order with `paymentStatus: "FAILED"`:

```json
{
  "items": [
    { "productId": "{{productId}}", "quantity": 2 }
  ],
  "paymentStatus": "FAILED"
}
```

**Before (broken lab):** stock may decrease **then** request fails with `402` — data corruption.

**After (done):**

```json
HTTP 402
{ "error": "Payment must be PAID to place an order" }
```

**Verify:** `GET /inventory` → quantity **unchanged** from step 1.

---

#### Request C — Insufficient stock

Pick a product and try to order more than available (e.g. quantity `999`).

**After (done):**

```json
HTTP 409
{ "error": "Insufficient stock for ..." }
```

**Verify:** stock unchanged.

---

### Task 3.3 — Image upload (already implemented — sanity check)

**File:** already wired (`src/middleware/upload.js`, product controller)

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `{{baseUrl}}/products/{{productId}}/image` |
| Headers | `Authorization: Bearer {{adminToken}}` |
| Body | **form-data** (not JSON) |

| Key | Type | Value |
|-----|------|-------|
| `image` | File | any small `.png` or `.jpg` |

**Expected:**

```json
HTTP 200
{
  "imageUrl": "/uploads/1690000000-123456789.png",
  ...
}
```

---

### Level 3 checkpoint

```bash
npm test -- tests/level3.test.js
```

Expected: **5/5 passing**

| Postman request | Proves |
|-----------------|--------|
| `GET /products?page=1&limit=2` | Pagination |
| `GET /products?search=Mouse` | Search |
| `GET /products?category=...&minPrice=...` | Filters |
| `POST /orders` PAID | Order + stock deduction |
| `POST /orders` FAILED | 402, stock unchanged |
| `POST /orders` over qty | 409, stock unchanged |
| `POST /products/:id/image` | Multer upload |

---

## Full lab checkpoint

```bash
npm test
```

Expected: **17/17 passing**

---

## Quick reference — all endpoints

| Method | URL | Auth | Level |
|--------|-----|------|-------|
| GET | `/health` | — | 1 |
| GET | `/inventory/boom` | — | 1 |
| GET | `/does-not-exist` | — | 1 |
| POST | `/auth/login` | — | 2 |
| GET | `/auth/me` | Bearer | 2 |
| POST | `/auth/register` | — | 2 |
| POST | `/auth/refresh` | — | 2 |
| GET | `/inventory` | — | 1 |
| POST | `/inventory` | Admin | 1 |
| GET | `/products` | — | 3 |
| POST | `/products` | Admin | 2 |
| POST | `/products/:id/image` | Admin | 3 |
| POST | `/orders` | Bearer | 3 |
| GET | `/orders` | Bearer | 3 |

---

## Optional — Postman Collection import

You can create a collection with a **Pre-request Script** on the Login folder:

```javascript
// After a login request, in the Tests tab:
const json = pm.response.json();
pm.environment.set("adminToken", json.accessToken);
```

Or import the environment example from `docs/http-client.env.example` and set tokens manually after each login.

---

## Troubleshooting Postman vs Jest mismatches

| Symptom | Likely cause |
|---------|----------------|
| Postman works, Jest fails | Test DB is separate — run `npm run db:test:prepare` |
| Always 500 with "error handler incomplete" | Task 1.1 not done |
| Admin routes return 200/501 instead of 403 | Task 2.1 or 2.2 not done |
| Stock changes on failed payment | Task 3.2 transaction / payment order wrong |
| `401` on every request | Token missing, expired, or `Authorization` header malformed |

When in doubt, compare your handler to the reference: `git show solutions:src/<file>`.
