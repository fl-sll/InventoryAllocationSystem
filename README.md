# Inventory Allocation System

Monorepo with an Express/PostgreSQL backend and a Next.js App Router frontend to plan purchase requests and visualize stock.

## How to run (backend)

1. `cd backend`
2. `cp .env.example .env` and fill the Postgres URLs / hub values (`FRONTEND_ORIGIN` defaults to `http://localhost:3000` for CORS—set it to your deployed frontend origin when needed).
3. Install deps: `npm install`
4. Run migrations & seeds: `npx sequelize-cli db:create`, `npx sequelize-cli db:migrate` and `npx sequelize-cli db:seed:all` (Sequelize CLI requires CommonJS files, so keep generated migrations as `.cjs`.)
5. Start API: `npm run dev` (port defaults to 3001)

### Key endpoints

- `GET /health`
- `GET /products`
- `GET /warehouses`
- `GET /stocks`
- `GET /purchase/requests`
- `GET /purchase/request/:id`
- `POST /purchase/request` (creates DRAFT)
- `PUT /purchase/request/:id` (only DRAFT; status PENDING triggers hub call)
- `DELETE /purchase/request/:id` (only DRAFT)
- `POST /webhook/receive-stock` (idempotent; only processes PENDING -> COMPLETED)

## How to run (frontend)

1. `cd frontend`
2. `cp .env.example .env` and point `NEXT_PUBLIC_API_BASE_URL` at the backend
3. Install deps: `npm install`
4. `npm run dev` (Next.js on port 3000)

### Receiving hub webhooks locally

When running the backend on localhost the hub simulator cannot reach `http://localhost:3001`. Use a tunneling tool such as [ngrok](https://ngrok.com/) or Cloudflare Tunnel:

1. Start the backend (`npm run dev` in `backend`).
2. Run a tunnel (e.g. `ngrok http 3001`).
3. Configure the Webhook Manager to point at the public tunnel URL plus the webhook path, e.g. `https://abc123.ngrok.io/api/receive-stock`.
4. Ensure `HUB_WEBHOOK_SECRET` in `.env` matches the secret shown in the Webhook Manager so signature verification succeeds.

## Design decisions

- **Status guardrails**: PRs start as DRAFT; only DRAFT can be edited/deleted; setting status to PENDING from PUT triggers a hub API call; webhook alone can mark COMPLETED to stay idempotent.
- **Idempotent webhook**: `POST /webhook/receive-stock` locks the purchase request row (serializable transaction). If already COMPLETED, returns skipped; if PENDING, it upserts stock per warehouse/product and flips status to COMPLETED.
- **ACID handling**: Creation/update/deletion of PRs and webhook stock application all run inside Sequelize transactions to keep items, requests, and stock consistent.
- **Reference generation**: PR references follow `PR00001` based on the DB id for uniqueness without a separate sequence.
- **Sequelize CLI compatibility**: ESM runtime uses `src/config/config.js`, while CLI uses `src/config/config.cjs` via `.sequelizerc` so migrations/seeds work under `type: module`.
- **Frontend UX**: Single-page dashboard for stocks, PR list, creation form, and detail editing. Error banners surface API errors; status chips color-code lifecycle; actions disable when status disallows edits.

## Possible improvements

- Add auth and role-based checks on mutating endpoints.
- Add integration tests for webhook idempotency and race conditions.
- Persist hub API responses/logging and introduce retries/backoff.
- Add pagination/filtering for large product/stock lists.
- Provide a small webhook simulator UI and websocket push updates for stocks.
