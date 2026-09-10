# Day 1 — Mission OS Commercial Foundation

## What I found in the project

- **Mission Engine (Kernel)** lives in `src/kernel/mission/*` — lifecycle, registry, queue, executor, in-memory state store. This stays as-is.
- **Persistent Mission Runtime** lives in `src/lib/missions/atlas.server.ts` (838 lines): capability discovery across brains/skills/tools/workflows/employees/knowledge, AI planner, `advanceMission` step executor with approval + human-handoff gates, `interpretCommand`.
- **The reachability problem is confirmed**: there is not a single `createServerFn` in the whole codebase. `atlas.server.ts` is never imported by any UI file, so the persistent runtime is dead code today. The Mission screens read the in-memory kernel engine via `src/lib/missions/hooks.ts`, which loses everything on refresh.
- **Database already has** `mission_runs`, `mission_run_steps`, `mission_run_events`, `mission_run_messages`, and the revenue set: `offers`, `leads`, `opportunities`, `customers`, `proposals`, `payments`, `revenue_events`. `payments` already has provider/provider_payment_ref/status columns — a real provider boundary, no fake confirmation.
- **Missing concept**: nothing connects "a customer buys a mission" to "a mission run executes". `offers` is a commercial catalog but has no objective/deliverables/execution reference; there is no order/purchase entity.

## What Day 1 builds

### 1. Server boundary (the actual blocker)
New `src/lib/missions/atlas.functions.ts` — thin `createServerFn` wrappers with `.middleware([requireSupabaseAuth])` around the existing runtime functions only (create + plan mission, advance mission, load mission detail, send command). No logic added here; it delegates to `atlas.server.ts` via in-handler `await import(...)`. This makes the existing persistent engine reachable without creating a second engine.

### 2. Mission Catalog (extend, don't duplicate)
Migration extends `public.offers` into a mission catalog entry:
`objective`, `scope`, `deliverables[]`, `customer_problem`, `mission_category`, `estimated_duration_minutes`, `requires_approval`, `execution_config jsonb` (planner hints / template reference), `is_mission boolean`.
Catalog rows stay configurable data — nothing hardcoded in UI.

### 3. Mission Orders (the missing commercial unit)
New table `public.mission_orders` with a new enum `mission_order_status`:
`draft → selected → purchase_pending → payment_verified → activated → delivered`, plus `cancelled`, `failed`, `refunded`.
Columns: `offer_id` (null for custom missions), `customer_id`, `owner_id`, `objective`/`context` (customer input for both catalog and custom missions), `amount`/`currency`, `payment_id`, `mission_id` → `mission_runs.id`, `activated_at`, `delivered_at`, `revenue_event_id`, timestamps, indexes, RLS + GRANTs.

**Commercial status stays separate from execution status**: the order carries the commercial state, `mission_runs.status` carries execution state. Payment verified ≠ mission complete; mission complete ≠ paid.

### 4. Activation path (Kernel-first, no parallel engine)
`src/lib/missions/commerce.functions.ts`:
- `createMissionOrder` — catalog or custom objective → order in `selected`.
- `activateMissionOrder` — refuses unless the linked `payments` row is provider-confirmed `succeeded`; then calls the **existing** `planMission` to create the `mission_runs` row and links it to the order. Execution afterwards runs through the existing runtime only.
- `recordMissionDelivery` — on real `mission_runs.status = completed`, writes the `revenue_events` row and moves the order to `delivered`. Never fired manually from the UI.

### 5. Payment boundary (documented, not faked)
`src/lib/payments/provider.ts` — provider-agnostic interface (`createCheckout`, `verifyPayment`) plus a `NotConfiguredProvider` that throws a clear "no payment provider connected" error. No provider is wired on Day 1; `activateMissionOrder` therefore blocks honestly. Documented in `docs/ATLAS_COMMERCIAL_MODEL.md`.

### 6. Day 1 UI (real data, honest empty states)
- `/mission-os` (inside the existing authenticated shell, existing design system): catalog list from `offers`, orders list from `mission_orders`, per-order commercial + execution status, link into the existing mission detail route.
- Custom-mission entry: objective textarea → order → same path.
- Empty catalog / empty orders → real empty states using `EmptyState`. No placeholder numbers anywhere.

The existing `/missions` dashboard and its in-memory kernel view are left untouched this sprint so nothing regresses.

## Out of scope for Day 1 (Day 2)
Real payment provider, checkout UI, public customer-facing catalog page, migrating `/missions` off the in-memory store onto the persistent runtime, mission performance/revenue reporting.

## Verification
Typecheck, lint, production build, migration applied, `/mission-os` loads on mobile and desktop, no secrets in client bundles, existing mission routes still work.
