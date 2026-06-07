# GharKhata — Family Finance Tracker

A small, warm-feeling finance app for one household. Three family members log in, log their expenses / income / subscriptions / groceries, set per-person and household budgets, and tag spending against shared events (Diwali, a Goa trip, a wedding). Built as a learning project — currency is INR, the design language is "candy soft", and the data model is shaped around how an Indian household actually thinks about money rather than what a generic expense tracker assumes.

```
Login (Supabase)  ───►  Dashboard  ──►  Expenses, Income, Subscriptions, Groceries
                                  │
                                  └──►  Budgets (per-person + household)
                                  └──►  Events (Diwali, trips, ...)
                                  └──►  Scope toggle: "Mine" / "Household"
```

> **Status**: This project is mid-migration from a 100% client-side prototype (Zustand + `localStorage`) to a real backend (**Supabase Postgres + Drizzle + Next.js Server Actions + TanStack Query**). Auth and the expenses domain have been migrated; income, subscriptions, groceries, budgets, and events still live in Zustand. See [Migration status](#migration-status) below and [`~/.claude/plans/cosmic-munching-brooks.md`](#) for the full plan.

---

## Quickstart

You will need: a recent Node-compatible runtime (we use **Bun**), a free [Supabase](https://supabase.com) project, and ~10 minutes.

```bash
# 1. Install
bun install

# 2. Set up Supabase (see below for the gotchas)
cp .env.example .env
# Edit .env and paste your Supabase URL, anon key, two database URLs, and service role key.

# 3. Apply schema and seed the DB
bun db:migrate
bun db:seed

# 4. Run the dev server
bun dev
# Open http://localhost:3000
```

Log in as any of the three seeded family members (see [Demo accounts](#demo-accounts) below).

---

## Tech stack

| Layer | What | Why |
|---|---|---|
| Runtime | Next.js 16 (App Router) + React 19 | Server Components, Server Actions, async middleware/proxy |
| Package manager | Bun | Fast installs, native `bun run` for TS scripts, automatic `.env` loading |
| Database | Supabase Postgres | Managed Postgres + Auth + RLS |
| ORM | Drizzle ORM | Schema-as-TypeScript, type-safe queries, lightweight |
| Migrations | drizzle-kit (auto) + custom SQL | Generated SQL files tracked in repo; RLS / CHECK constraints hand-written |
| Auth | Supabase Auth (email + password) via `@supabase/ssr` | Cookie-based sessions that survive Server Components |
| Client cache | TanStack Query v5 | Server state lives here; Zustand stays for UI state only |
| Styling | Tailwind v4 (CSS-first) + shadcn/ui + Recharts + framer-motion | shadcn vendored, palette canonical in `src/lib/charts/theme.ts` |
| Form handling | react-hook-form + Zod v4 | Shared Zod schemas across client + server |

---

## Migration status

| Domain | Storage | Hooks / Helpers |
|---|---|---|
| Auth | ✅ Supabase Auth (Postgres-backed) | `useUser()`, `requireMember()` |
| Expenses | ✅ Supabase Postgres | `useExpensesQuery / useCreateExpense / useUpdateExpense / useDeleteExpense` |
| Income | ✅ Supabase Postgres | `useIncomesQuery / useCreateIncome / useUpdateIncome / useDeleteIncome` |
| Subscriptions | ✅ Supabase Postgres | `useSubscriptionsQuery / useCreateSubscription / useUpdateSubscription / useDeleteSubscription` |
| Groceries | ✅ Supabase Postgres | `useGroceriesQuery / useCreateGrocery / useUpdateGrocery / useDeleteGrocery` |
| Budgets | ✅ Supabase Postgres | `useBudgetsQuery / useSetBudget / useUpdateBudget / useDeleteBudget` |
| Scope toggle ("Mine" / "Household") | Zustand (UI state only — stays put) | `useScopeStore` |
| Events | ⏳ Zustand + `localStorage` | `useEventStore` |

Each ⏳ row reads from `MOCK_*` seeds in `src/lib/utils/mockData.ts` on first load, then persists local changes to `localStorage`. To re-seed during dev, delete the relevant key from DevTools → Application → Local Storage.

---

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com). Save the database password.
2. Copy values into `.env` (already gitignored):

   | Variable | Where to find it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → "Project URL" |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → "anon public" |
   | `SUPABASE_SERVICE_ROLE_KEY` | Same page → "service_role" (reveal). **Server-side only.** |
   | `DATABASE_URL` | Click "Connect" → **Transaction pooler** (port 6543) |
   | `DATABASE_DIRECT_URL` | Click "Connect" → **Session pooler** (port 5432) |

3. `bun db:migrate` and `bun db:seed`.

> Two common traps the first time through: the **Direct connection** (not pooler) is IPv6-only on new projects — don't use it; use Session pooler. And passwords with `@ : / ? # & % [ ] +` need to be URL-encoded. Both are covered in detail in [`docs/troubleshooting.md`](docs/troubleshooting.md).

---

## Demo accounts

The seed script creates these three users in Supabase Auth and inserts them as `household_members`:

| Name | Email | Password | Role |
|---|---|---|---|
| Rajesh | `rajesh@gharkhata.local` | `gharkhata-dev-1234` | admin |
| Priya | `priya@gharkhata.local` | `gharkhata-dev-1234` | member |
| Arjun | `arjun@gharkhata.local` | `gharkhata-dev-1234` | member |

All three belong to the same household, so toggling the scope switch between "Mine" and "Household" shows different views.

---

## Project layout

```
src/
├── app/                          ← Next.js App Router
│   ├── (auth)/login/             ← Supabase email + password login
│   └── (dashboard)/              ← server-component auth guard
│       ├── layout.tsx            ← async, calls requireMember()
│       ├── dashboard/            ← Hero stat + widget grid
│       ├── expenses/             ← table + add/edit/delete (DB-backed)
│       ├── income/               ← table + form (Zustand)
│       ├── subscriptions/        ← card grid + form (Zustand)
│       ├── groceries/            ← trip log (Zustand)
│       ├── budgets/              ← per-user + household budget tables (Zustand)
│       └── events/               ← list + detail page (Zustand)
├── proxy.ts                      ← Next 16 session-refresh middleware (was middleware.ts)
├── components/
│   ├── ui/                       ← shadcn primitives (vendored)
│   ├── layout/                   ← Header, Sidebar, BottomNav, ScopeToggle, OwnerPill
│   ├── dashboard/                ← Hero, charts, widgets
│   └── <domain>/                 ← XForm + XList + XCard per domain
├── lib/
│   ├── server/                   ← 'server-only' code
│   │   ├── db/                   ← Drizzle schema, client, migrations, seed
│   │   ├── supabase/             ← createSupabaseServerClient, requireMember
│   │   └── actions/              ← 'use server' CRUD per migrated domain
│   ├── client/
│   │   ├── QueryProvider.tsx     ← TanStack Query root
│   │   └── hooks/                ← useXQuery + useCreateX/UpdateX/DeleteX per domain
│   ├── store/                    ← Zustand stores (shrinks as migration proceeds)
│   ├── schemas/                  ← Zod schemas shared by forms and server actions
│   ├── charts/                   ← Recharts palette (canonical colours)
│   └── utils/                    ← formatCurrency, dateHelpers, scopeFilter, budgetStatus, eventStatus, mockData
└── types/                        ← TypeScript types for domain objects
```

Most of those folders have a focused `CLAUDE.md` covering their specific conventions — open the folder to see it.

---

## Development workflow

### Common commands

```bash
bun dev               # dev server (Turbopack)
bun build             # production build (also runs TypeScript)
bunx tsc --noEmit     # standalone type check (faster while iterating)
bun lint              # ESLint 9 (flat config in eslint.config.mjs)

bun db:generate       # diff schema.ts → write a new SQL migration
bun db:migrate        # apply pending migrations
bun db:seed           # re-seed (truncates domain data)
bun db:studio         # open drizzle-kit's GUI against the DB
```

### Verification bar before committing

1. `bunx tsc --noEmit` is clean
2. `bun lint` returns 0 errors (3 accepted `react-hooks/incompatible-library` warnings about `watch()` in form files are fine)
3. `bun run build` produces all routes
4. Manual browser smoke against the changed surface (there are no automated tests yet)

### Adding a new domain (the canonical recipe)

For migrating an existing domain *off Zustand into Postgres*, follow [`src/lib/server/actions/CLAUDE.md`](src/lib/server/actions/CLAUDE.md) — there's a five-piece template (Server Action → hooks → form → consumers → delete the store) taken from how the expenses migration landed.

For adding a *brand new domain* (e.g. "loans"), the root [`CLAUDE.md`](CLAUDE.md) has a worked example that walks through every layer (type → Zod schema → mock seed → Zustand store, optionally → util → components → page → nav).

### Adding a database column or table

1. Edit `src/lib/server/db/schema.ts`.
2. `bun db:generate` — creates a new SQL file under `migrations/`.
3. Inspect the generated SQL. Edit `schema.ts` and regenerate if it's wrong (delete the new migration first).
4. `bun db:migrate` to apply.

For things Drizzle can't express (partial unique indexes, RLS policies, scope-conditional CHECK constraints), scaffold a custom migration:

```bash
bunx drizzle-kit generate --custom --name <descriptive_name>
```

That creates an empty `.sql` file AND adds it to Drizzle's journal so `migrate.ts` picks it up.

---

## Going deeper

The root README is the landing page; longer-form references live in [`docs/`](docs/):

- [`docs/architecture.md`](docs/architecture.md) — household model, scope toggle, Server Actions + TanStack Query data flow, request walkthroughs.
- [`docs/database.md`](docs/database.md) — schema, column conventions, migration workflow (auto + custom SQL), RLS policies, seed script.
- [`docs/auth.md`](docs/auth.md) — Supabase auth flow, cookie shuttle, `requireMember()` guard, `useUser()` hook.
- [`docs/migration.md`](docs/migration.md) — current migration status and the 5-piece template for each upcoming domain.
- [`docs/troubleshooting.md`](docs/troubleshooting.md) — symptoms and fixes for the gotchas you'll hit (Supabase URL traps, the `--color-brand-blue` invisible-button bug, Tailwind v4 token requirements, …).

If you're skimming, start with `docs/README.md` as the index.

---

## Roadmap

The remaining migration phases (income → subscriptions → groceries → budgets → events) follow the same template established by expenses. Once those land, the `useXStore.ts` files are deleted; only `useScopeStore.ts` and the QueryProvider stay.

Possible polish work after the migration finishes:
- Re-style the email+password login form to feel more playful (the original PIN UX was nicer; the standard form is functional but flat).
- Optimistic creates on mutations (skipped today because placeholder-id management is fiddly).
- Real-time sync via Supabase Realtime if family members editing simultaneously becomes a thing.

---

## Documentation map

For humans:
- **This README** — overview, quickstart, status.
- **[`docs/`](docs/)** — deeper reference (architecture, database, auth, migration, troubleshooting).

For Claude Code (auto-loaded):
- **[`CLAUDE.md`](CLAUDE.md)** — root conventions + 10 documented landmines.
- **Per-folder `CLAUDE.md`** in `src/lib/server/db/`, `src/lib/server/actions/`, `src/lib/server/supabase/`, `src/lib/client/hooks/`, `src/lib/schemas/`, `src/lib/charts/`, `src/components/ui/`. Each captures the rules specific to its folder.
- **[`AGENTS.md`](AGENTS.md)** — short reminder about Next.js version and deprecation notices.

---

## License

This is a personal learning project. No license declared.
