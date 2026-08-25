# Aroge Backoffice Admin Dashboard

## Folder tree

```text
src/
  app/
    (auth)/login/page.tsx
    (admin)/admin/{dashboard,users,catalog,orders,disputes,reports,authorization,notifications,settings,audit-log}/page.tsx
    api/auth/{request-code,verify-code,refresh,logout}/route.ts
  entities/admin.ts
  features/layout/admin-shell.tsx
  shared/
    api/client.ts
    config/env.ts
    ui/cards.tsx
```

## RBAC + ABAC data model

- **roles**: id, name, description, version, archived.
- **permissions**: resource + action keys (e.g. `orders.refund`).
- **assignments**: user-role + optional direct permissions.
- **policies**: ABAC effect + condition expression JSON, evaluated with deny-by-default.
- **audit_log**: immutable event store capturing actor, target, diff, trace id, timestamp.
- **simulator**: evaluates role permissions then ABAC policies and returns allow/deny reason chain.

## Seed data example

- Roles: `SuperAdmin`, `RiskAnalyst`, `SupportAgent`, `FinanceOps`, `CatalogModerator`.
- Permissions: `orders.read`, `orders.refund`, `disputes.resolve`, `payouts.release`, `catalog.moderate`.
- Policies:
  - `allow disputes.resolve when resource.region == user.region`
  - `allow orders.refund when amount <= user.maxRefundAmount`
  - `deny catalog.edit when category not in user.assignedCategories`

## Run instructions

1. `npm install`
2. Create `.env.local`:
   - `NEXT_PUBLIC_HONO_API_BASE_URL=https://your-hono-api`
   - `NEXT_PUBLIC_SENTRY_DSN=...`
3. `npm run dev`
4. Open `http://localhost:3000/login`

## Security model

- Session cookies are HTTP-only and proxied via Next route handlers.
- CSRF token header should be enforced by Hono auth middleware.
- Trace IDs are passed per request (`x-trace-id`) for observability.
- Privileged actions must enforce step-up verification + audit logs.

## Wireframes (textual)

- **Login**: phone input, OTP request, code verify, resend countdown, error banner.
- **Dashboard**: KPI cards, risk feed, draggable widgets, date filters, drill-down links.
- **Users**: unified grid + saved filters, detail side panel, admin actions.
- **Authorization**: role editor, permission matrix, ABAC policy composer, effective-access simulator.
- **Disputes**: SLA queue, case timeline, evidence viewer, mediator actions.
