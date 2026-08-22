# Backend Craft Lab

Progressive, hands-on **Node.js + Express** backend API lab built as a multi-tier **E-Commerce & Inventory Management REST API**.

This repository uses a **fill-in-the-blanks (code koan)** style: core middleware, routes, services, and controllers on `main` contain incomplete logic marked with `TODO` tags. A complete reference lives on the `solutions` branch.

## Two-branch workflow

| Branch | Purpose |
|--------|---------|
| `main` | Active lab environment — incomplete logic, failing tests |
| `solutions` | Fully working implementation — all Jest tests pass |

Compare your work anytime:

```bash
git diff solutions..main
# or, after you've edited files on main:
git diff solutions -- src/
```

## Stack

- **Express.js** (JavaScript / CommonJS)
- **Prisma ORM** + **SQLite** (zero-config local DB; swap to PostgreSQL by changing `schema.prisma`)
- **Zod** request validation
- **JWT** access + refresh tokens (`jsonwebtoken`)
- **bcryptjs** password hashing
- **express-rate-limit**, **cors**, **multer**
- **Jest** + **Supertest** integration tests

## Folder structure

```
├── prisma/           # schema, migrations, seed
├── src/
│   ├── config/       # env + Prisma client
│   ├── controllers/
│   ├── middleware/   # auth, RBAC, validation, errors, rate limit, upload
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/   # Zod schemas
│   ├── app.js
│   └── server.js
└── tests/            # Level 1–3 integration suites
```

## Quick start

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env

# 3. Create SQLite DB + generate client
npx prisma db push

# 4. Seed demo users & products
npm run db:seed

# 5. Run API (watch mode)
npm run dev
```

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Seeded accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lab.local` | `Admin123!` |
| Customer | `customer@lab.local` | `Customer123!` |

## Running tests

Tests use a separate SQLite file (`prisma/test.db`). The npm scripts set env vars for you (Windows + macOS/Linux via `cross-env`):

```bash
npm run db:test:prepare   # optional — `npm test` also runs db push
npm test
npm test -- tests/level1.test.js   # run one level
```

On `main`, tests **fail** until you complete the TODOs. On `solutions`, they **pass**.

```bash
git checkout solutions
npm test
```

## Troubleshooting

### Windows: `npm install` fails with `EPERM` renaming `query_engine-windows.dll.node`

Prisma cannot overwrite its native engine DLL because another process has it open (a running `node` server, VS Code Prisma extension, antivirus, or a leftover Node process).

**Fix:**

1. Stop the API if it is running (`Ctrl+C` in the terminal that ran `npm run dev`).
2. Close other terminals in this project. Optionally close VS Code, or disable the Prisma extension temporarily.
3. Delete the locked client folder and reinstall:

```powershell
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
npm install
```

If `npm install` still fails on `postinstall`, skip lifecycle scripts then generate separately:

```powershell
npm install --ignore-scripts
npm run db:generate
```

If generate still reports `EPERM`, kill leftover Node processes and retry:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npm run db:generate
```

The `package.json#prisma is deprecated` line is only a **warning** (Prisma 7 will use a config file). It does not cause the install failure.

## Lab levels

### Level 1 — Beginner (Routing, Validation, Errors, CRUD)

Concepts: Express routers, centralized error middleware, Zod validation, inventory CRUD.

| Marker | File | Task |
|--------|------|------|
| `TODO [Level 1]` | `src/middleware/errorHandler.js` | Map Zod/AppError to clean JSON responses |
| `TODO [Level 1]` | `src/middleware/validate.js` | Parse request body/query with Zod |
| `TODO [Level 1]` | `src/services/inventory.service.js` | Implement create + list inventory queries |
| `TODO [Level 1]` | `src/controllers/inventory.controller.js` | Call the service instead of stub responses |

### Level 2 — Intermediate (Auth, Security, Middleware)

Concepts: password hashing, JWT issue/verify, `authMiddleware`, RBAC (Admin vs Customer), rate limiting.

| Marker | File | Task |
|--------|------|------|
| `TODO [Level 2]` | `src/middleware/auth.js` | Extract Bearer token, verify JWT, handle expiry |
| `TODO [Level 2]` | `src/middleware/rbac.js` | Enforce `requireRole(...roles)` |

### Level 3 — Advanced (Transactions, Relations, Async)

Concepts: Prisma `$transaction` for order + stock + invoice, pagination/filtering, Multer uploads.

| Marker | File | Task |
|--------|------|------|
| `TODO [Level 3]` | `src/services/order.service.js` | Check payment **before** stock changes; wrap in a transaction |
| `TODO [Level 3]` | `src/services/product.service.js` | Build `where` filters, `skip`/`take`, search |

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/inventory` | — | List inventory |
| POST | `/api/inventory` | Admin | Create inventory (+ optional product) |
| GET | `/api/products` | — | List/search/paginate products |
| POST | `/api/products` | Admin | Create product |
| POST | `/api/products/:id/image` | Admin | Upload image (`multipart/form-data`, field `image`) |
| POST | `/api/orders` | Bearer | Place order (transactional) |
| GET | `/api/orders` | Bearer | List own orders (admin: all) |

## Manual testing (Postman / Bruno)

1. `POST /api/auth/login` with seeded admin credentials → copy `accessToken`.
2. Set header `Authorization: Bearer <accessToken>`.
3. `POST /api/inventory` with body:

```json
{
  "name": "Desk Lamp",
  "sku": "DL-900",
  "price": 34.5,
  "category": "Home",
  "quantity": 15,
  "location": "D-4"
}
```

4. Login as customer → `POST /api/orders`:

```json
{
  "items": [{ "productId": "<id from products list>", "quantity": 1 }],
  "paymentStatus": "PAID"
}
```

5. Confirm stock decreased via `GET /api/inventory`.

### Bruno / Postman tip

Import a collection with a base URL variable `{{baseUrl}}` = `http://localhost:3000/api` and an `auth` folder that saves `accessToken` from login into an environment variable.

**Step-by-step manual tests per task:** see [docs/POSTMAN_TESTING.md](docs/POSTMAN_TESTING.md).

## Switching to PostgreSQL (optional)

1. Change `provider` in `prisma/schema.prisma` to `"postgresql"`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. Run `npx prisma migrate dev --name init`.

## Learning tips

1. Run `npm test` on `main` and read the first failing assertion.
2. Search the codebase for `TODO [Level N]`.
3. Implement the smallest change that makes that test pass.
4. When stuck, peek with `git show solutions:src/path/to/file.js`.
5. Prefer understanding the solution over copy-pasting — interviews ask *why*.

## License

MIT
