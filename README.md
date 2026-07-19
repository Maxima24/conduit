# Conduit

Reliable webhook delivery — end to end, with proof. Ingest → deliver (retry/DLQ) →
reconcile, with a live dashboard.

**Stack:** Turborepo · NestJS 11 · Next.js 16 (App Router) · PostgreSQL + Prisma 7 ·
Redis + BullMQ · Zustand · TanStack Query · Tailwind v4.

## Layout

```
apps/
  api/        NestJS — webhooks · events · delivery · reconciliation · stream · stats
  web/        Next.js 16 App Router — events · dlq · reconciliation · stats
packages/
  contracts/  ★ shared DTOs + zod + routes (source of truth — both apps import it)
  tsconfig/   shared TS base configs
  eslint-config/
```

## Prerequisites

Node ≥ 20.19 (24 recommended) · pnpm 9 · Docker (Postgres + Redis).

## Getting started

```bash
cp .env.example .env            # fill RESEND_API_KEY / WEBHOOK_SECRET_* as needed
pnpm install
docker compose up -d            # postgres:5432 + redis:6379
pnpm db:generate                # generate the Prisma 7 client (src/generated/prisma)
pnpm db:migrate                 # apply migrations
pnpm db:seed                    # realistic events, sends, attempts, DLQ + one injected gap
pnpm dev                        # turbo runs api (:3001) + web (:3000)
```

The web app defaults to **mock mode** (`NEXT_PUBLIC_USE_MOCKS=true` in `apps/web/.env.local`)
so every view renders before the API is up. Flip it to `false` to hit the live API.

## Scripts (root)

| Command | What |
|---|---|
| `pnpm dev` | api + web in parallel (Turbo) |
| `pnpm build` | build everything (contracts first) |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | across the graph |
| `pnpm db:migrate` / `pnpm db:seed` | Prisma migrate / seed (via dotenv-cli → root `.env`) |

## Architecture rules (enforced in review)

- No Prisma import outside a `*.repository.ts`.
- No wire type defined outside `packages/contracts`.
- No server data in Zustand (UI intent only; server state lives in TanStack Query).
- Timestamps are ISO 8601 UTC strings; absent values are `null`, never `undefined`.
- Every error returns the `ApiError` envelope; every list endpoint is cursor-paginated.

## Scaffold status

This is the **scaffold**: the workspace, the full contract package, the Prisma schema, and
every module/route wired end to end. Read paths (events, sends, reconcile, stats) query real
data; webhook ingest persists idempotently + enqueues. The correctness-critical feature logic
is left as clearly-marked `TODO(BEx)` stubs for the owning devs:

- **BE2 delivery** — the BullMQ worker (`delivery.processor.ts`): real Resend send, attempt
  recording, exponential backoff + jitter, dead-lettering.
- **BE2** — `POST /sends/:id/replay` (idempotent re-enqueue) and the scheduled reconciler job
  that *detects* gaps (`reconciliation.service.ts#runReconciler`).
- **BE1** — hardened per-source HMAC schemes (`webhooks.service.ts#verifySignature`).
- **BE1/BE2** — `duplicatesRejected` metric in `/stats`.

## Deployment

- **API → Render** — `render.yaml` (free Postgres + Redis; worker in-process; `/health` check).
- **Web → Vercel** — root `apps/web`; build command
  `cd ../.. && pnpm turbo run build --filter=@conduit/web`; set `NEXT_PUBLIC_API_URL` to the
  Render URL and `NEXT_PUBLIC_USE_MOCKS=false`.
