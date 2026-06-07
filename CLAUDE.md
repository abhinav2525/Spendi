# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Uses **Bun** as package manager (not npm/yarn — `bun.lock` is the lockfile).

```bash
bun dev          # start dev server (Turbopack)
bun build        # production build (also runs the TypeScript compiler — broken types fail the build)
bun start        # serve production build
bun lint         # ESLint 9 flat config via eslint.config.mjs
```

TypeScript is checked by Next.js during build. For a standalone type check (faster while iterating):
```bash
bunx tsc --noEmit
```

**Database commands** (added during the Phase-1 backend migration — see "Backend migration" section below). All require `.env.local` populated from `.env.example`:

```bash
bun db:generate  # diff schema.ts → write a new SQL file under src/lib/server/db/migrations/
bun db:migrate   # apply pending migrations to the database referenced by DATABASE_DIRECT_URL
bun db:seed      # creates household + 3 Supabase auth users + seeds mock data (idempotent for users)
bun db:studio    # open drizzle-kit's GUI against the configured DB
```

Hand-written SQL migrations (RLS policies, CHECK constraints, partial unique indexes) are scaffolded via `bunx drizzle-kit generate --custom --name <name>` so Drizzle's journal tracks them alongside the auto-generated ones.

There are no tests at this time. The verification bar before committing is:
1. `bunx tsc --noEmit` is clean
2. `bun lint` returns 0 errors (a couple of `react-hooks/incompatible-library` warnings about `watch()` in form files are accepted)
3. `bun run build` produces all routes
4. Manual browser smoke against the changed surface

## Architecture

> **Backend migration in progress** — the original architecture was 100% client-side (Zustand + localStorage). It's being incrementally moved to **Supabase Postgres + Drizzle + Next.js Server Actions + TanStack Query**. Full plan: `~/.claude/plans/cosmic-munching-brooks.md`.
>
> **Migration status:**
> | Domain | Layer |
> |---|---|
> | Auth | ✅ Supabase Auth (email + password) — `useAuthStore` deleted |
> | Expenses | ✅ Server Actions + TanStack Query — `useExpenseStore` deleted |
> | Income | ✅ Server Actions + TanStack Query — `useIncomeStore` deleted |
> | Subscriptions | ✅ Server Actions + TanStack Query — `useSubscriptionStore` deleted |
> | Groceries | ✅ Server Actions + TanStack Query — `useGroceryStore` deleted (`totalAmount` recomputed server-side) |
> | Budgets | ✅ Server Actions + TanStack Query — `useBudgetStore` deleted (`setBudget` upserts via `onConflictDoUpdate` on partial unique indexes) |
> | Events | ✅ Server Actions + TanStack Query — `useEventStore` deleted (Zod + DB CHECK enforce `endDate >= startDate`; delete cascades to `expenses.eventId = NULL`) |
> | Scope toggle | Stays Zustand (UI state, not server state) |
>
> **All domains are migrated.** The only Zustand store still alive is `useScopeStore` (UI state). What's left is Phase 9 (final cleanup): retire `scopeFilter.ts`, confirm `mockData.ts` only feeds the seed script, refresh any stale doc references.
>
> Before assuming a domain uses Zustand: grep `useXxxStore`. If the store file is gone, the domain is migrated and consumers use `useXxxQuery / useCreateX / useUpdateX / useDeleteX` hooks under `src/lib/client/hooks/`. See **"Migrated domain pattern"** below for the canonical template (established by expenses, applied to income and subscriptions).

**GharKhata** is a (Phase 0) purely client-side family finance tracker for an Indian household (INR currency, Hindi-derived names, "trip" model for groceries). State lives in `localStorage` via Zustand `persist` middleware.

```
                ┌─────────────────────────────────────────────────┐
                │  Browser                                         │
                │                                                  │
                │   React component                                │
                │      │ useXxxStore()                             │
                │      ▼                                            │
                │   Zustand store ◀──────┐                          │
                │      │                  │                         │
                │      ▼                  │ persist middleware      │
                │   localStorage ─────────┘                         │
                │                                                  │
                │   On first load: MOCK_XXX from mockData.ts        │
                │   On subsequent loads: hydrate from localStorage  │
                └─────────────────────────────────────────────────┘
```

**Hydration footgun:** once `localStorage` has a snapshot of a store, edits to the `MOCK_XXX` seed have no effect on existing sessions. To re-seed during development, open DevTools → Application → Local Storage and delete the relevant `*-storage` key, or bump the `name` option on the store's `persist()` call.

### Backend migration (Phase 1+)

The server layer and client cache layer that subsequent phases will fill out:

```
src/lib/
  server/                      ← 'server-only', never imported from client code
    db/
      client.ts                ← postgres.js → Supabase pooler (prepare:false when pooler URL detected)
      schema.ts                ← Drizzle table defs + pg enums (8 tables, mirrors src/types/index.ts)
      migrate.ts               ← runs drizzle-kit migrations against DATABASE_DIRECT_URL
      seed.ts                  ← creates 1 household + 3 auth users + inserts MOCK_* data
      migrations/              ← 0000_* auto-generated; 0001_policies.sql is hand-written
    supabase/                  ← (Phase 2) createServerClient + requireUser helpers
    actions/                   ← (Phase 3+) 'use server' CRUD per domain
  client/
    QueryProvider.tsx          ← TanStack Query client, wraps root layout (already wired in)
    hooks/                     ← (Phase 3+) useXxxQuery + useXxxMutation per domain
```

**Hand-written SQL migrations** (RLS, CHECK constraints, partial unique indexes for the budget upsert key) live in `migrations/0001_policies.sql` and are tracked by Drizzle's journal — created via `bunx drizzle-kit generate --custom --name policies`, then edited in place. Don't author free-standing `.sql` files outside the migrations folder; the migrator won't see them.

**Drizzle column naming**: schema.ts uses bare `uuid()`, `text()`, etc. with no explicit column name and **no** `casing` override, so JS camelCase property names become camelCase columns in Postgres (e.g. `"householdId"`). If you add `casing: 'snake_case'` to one of the two configs (drizzle.config.ts for drizzle-kit, `drizzle()` for runtime) without the other, queries silently fail because they look for differently-cased columns. Either keep both off (current state) or set both.

**RLS recursion guard**: `current_household_id()` in `0001_policies.sql` is `SECURITY DEFINER` so that the per-row `household_id` lookup against `household_members` doesn't recurse through that table's own RLS policy. The explicit `SET search_path = public` is a hardening measure that goes hand-in-hand with `SECURITY DEFINER` — don't drop it.

**Session refresh middleware**: lives at `src/proxy.ts` (NOT `src/middleware.ts` — Next 16 renamed the convention; the exported function must be named `proxy`, not `middleware`). It's a no-op when Supabase env vars are missing, so the file can stay in place during partial migrations. The cookie-shuttle pattern (`request.cookies.set` → `NextResponse.next({ request })` → `response.cookies.set` → apply Supabase's `headers` arg for cache-control) is load-bearing — skipping any step causes "logged in but acts logged out" bugs.

### Migrated domain pattern (canonical example: expenses)

Every domain that's been migrated follows the same five-piece template. Use it verbatim when migrating the next domain.

1. **Server Action** (`src/lib/server/actions/<domain>.ts`)
   - File starts with `'use server'`
   - Every function calls `await requireMember()` first — that returns the `CurrentMember` (joined Supabase auth user + `household_members` row) and is the source of truth for `userId` and `householdId`. Never trust those fields from the client payload.
   - `listX({ scope: 'mine' | 'household' })` filters by `householdId` always; adds `eq(userId, me.id)` when `scope === 'mine'`.
   - `createX(input)` validates input with the existing Zod schema, then inserts with server-supplied `userId` and `householdId`.
   - `updateX(id, partial)` builds the partial column set with `if (input.x !== undefined) update.x = ...` — using `.set(input)` directly would silently null out unrelated columns.
   - Always include `eq(householdId, me.householdId)` in the `WHERE` of update/delete as a belt-and-suspenders check on top of RLS.
   - Return rows mapped through a `rowToX` helper that converts DB `null` to the existing `Expense`-style `undefined` for optional fields, so consumers don't need TypeScript changes.

2. **Client hooks** (`src/lib/client/hooks/useX.ts`)
   - `useXQuery(scope)` → `useQuery(['<domain>', scope], () => listX({ scope }))`, with `staleTime: 30_000` and `placeholderData: keepPreviousData` (the second one prevents an empty flash when toggling scope).
   - `useCreateX / useUpdateX / useDeleteX` → `useMutation` with `onSettled: invalidateQueries({ queryKey: ['<domain>'] })`. Add optimistic `onMutate` + `onError` rollback for delete (cheap to implement, snappy UX).

3. **Form** (`src/components/<domain>/XForm.tsx`)
   - Replace `useXStore().addX/updateX` with `useCreateX()` / `useUpdateX()`.
   - **Drop the `userId: currentUser!.id` injection** — server fills it.
   - Submit pattern: `mutation.mutate(payload, { onSuccess: onClose })`.

4. **Consumers** (table, charts, dashboard widgets)
   - Replace `const { items } = useXStore()` and `filterByScope(items, scope, ...)` with `const { data: items = [] } = useXQuery(scope)`. Scope filtering is now server-side, so the client-side `filterByScope` call goes away.
   - Cross-store joins (e.g. `BudgetTable` reads budgets *and* expenses): just compose two queries. Don't combine into one server action prematurely.

5. **Delete the store file** (`src/lib/store/useXStore.ts`). Grep to confirm zero importers first.

### Routing (Next.js App Router)

```
src/app/
  page.tsx                    → redirects to /login
  (auth)/login/               → Supabase email+password (was PIN before Phase 2)
  (dashboard)/                → server-component guard, redirects to /login if unauthed
    layout.tsx                → async server component → requireMember() + Sidebar + BottomNav
    dashboard/                → HeroStat + widget grid (charts, budget status, recent tx)
    expenses/                 → searchable table + add/edit/delete modal
    groceries/                → itemized trip log with expand/collapse
    income/                   → source pie + table CRUD
    subscriptions/            → card grid with renewal urgency badges
    budgets/                  → per-user and household budget tables
    events/                   → event cards with status filters
    events/[id]/              → event detail: hero, category breakdown, linked expenses
```

`(auth)` and `(dashboard)` are route groups (parentheses = no URL segment in the URL). The auth guard is **server-side** (Phase 2 onward): `(dashboard)/layout.tsx` is an `async` server component that calls `await requireMember()` — which reads the Supabase session cookie via `@supabase/ssr` and joins to `household_members` via Drizzle, redirecting to `/login` if either step fails. Anything inside `(dashboard)/` is therefore route-protected even with JS disabled.

**Dynamic routes** (`events/[id]/page.tsx`) must use `useParams()` from `next/navigation` inside a client component. The `params` prop is a `Promise` in Next 15+ — sidestep the async dance by being a client component (which dashboard pages already must be, because of Zustand).

### State (Zustand stores)

Each domain has its own store in `src/lib/store/`. All use `persist` middleware:

| Store | Persisted key | Seed | Status |
|---|---|---|---|
| `useAuthStore` | — | — | **DELETED in Phase 2**, replaced by Supabase Auth + `useUser()` hook |
| `useScopeStore` | `scope-storage` | defaults to `'mine'` | Stays — UI state, not server state |
| `useExpenseStore` | — | — | **DELETED in Phase 3**, replaced by `useExpensesQuery` + mutation hooks |
| `useIncomeStore` | — | — | **DELETED in Phase 4**, replaced by `useIncomesQuery` + mutation hooks |
| `useSubscriptionStore` | — | — | **DELETED in Phase 5**, replaced by `useSubscriptionsQuery` + mutation hooks |
| `useGroceryStore` | — | — | **DELETED in Phase 6**, replaced by `useGroceriesQuery` + mutation hooks |
| `useBudgetStore` | — | — | **DELETED in Phase 7**, replaced by `useBudgetsQuery` + `useSetBudget` (upsert) + `useUpdateBudget` + `useDeleteBudget` |
| `useEventStore` | — | — | **DELETED in Phase 8**, replaced by `useEventsQuery` + `useCreateEvent` + `useUpdateEvent` + `useDeleteEvent` |

Pending-migration stores still follow the legacy CRUD shape: `items: T[]`, `addX(omit-id)`, `updateX(id, partial)`, `deleteX(id)`, with `nanoid` IDs. Seeded auth users (post-Phase-2, in Supabase): `rajesh@gharkhata.local` / `priya@gharkhata.local` / `arjun@gharkhata.local`, all with password `gharkhata-dev-1234` (seed script).

### Per-domain file map

The pattern is consistent — find the files for any domain by name. **State column** shows where data lives: migrated domains use Server Actions (server) + hooks (client); pending domains still use Zustand stores.

| Domain | Type (`src/types/index.ts`) | Schema | State | Util | Components dir |
|---|---|---|---|---|---|
| Auth | `User` | `auth.schema.ts` | ✅ `server/supabase/auth.ts` + `client/hooks/useUser.ts` | — | `components/layout/` |
| Expenses | `Expense`, `ExpenseCategory`, `PaymentMode` | `expense.schema.ts` | ✅ `server/actions/expenses.ts` + `client/hooks/useExpenses.ts` | — | `components/expenses/` |
| Income | `Income`, `IncomeSource`, `IncomeFrequency` | `income.schema.ts` | ✅ `server/actions/incomes.ts` + `client/hooks/useIncomes.ts` | — | `components/income/` |
| Subscriptions | `Subscription`, `SubscriptionFrequency`, `SubscriptionCategory` | `subscription.schema.ts` | ✅ `server/actions/subscriptions.ts` + `client/hooks/useSubscriptions.ts` | — | `components/subscriptions/` |
| Groceries | `GroceryEntry`, `GroceryItem` | `grocery.schema.ts` | ✅ `server/actions/groceries.ts` + `client/hooks/useGroceries.ts` | — | `components/groceries/` |
| Budgets | `Budget`, `BudgetCategory`, `BudgetScope` | `budget.schema.ts` | ✅ `server/actions/budgets.ts` + `client/hooks/useBudgets.ts` | `budgetStatus.ts` | `components/budgets/` |
| Events | `FinanceEvent`, `EventScope` | `event.schema.ts` | ✅ `server/actions/events.ts` + `client/hooks/useEvents.ts` | `eventStatus.ts` | `components/events/` |
| Scope toggle (UI state, stays) | — | — | `store/useScopeStore.ts` (Zustand) | `scopeFilter.ts` (used only by pending-migration consumers) | `components/layout/ScopeToggle.tsx` |

### Scope toggle (Mine / Household)

`useScopeStore` exposes a global `scope: 'mine' | 'household'` controlled by `<ScopeToggle />` mounted in `Header`. **Every list/chart that filters by user must use this pattern**:

```ts
import { useScopeStore } from '@/lib/store/useScopeStore'
import { filterByScope } from '@/lib/utils/scopeFilter'

const { scope } = useScopeStore()
const { currentUser } = useAuthStore()
const visible = filterByScope(items, scope, currentUser?.id)
```

`filterByScope` is generic over `T extends { userId: string }` and returns all items when `scope === 'household'`, only the current user's when `scope === 'mine'`. When rendering household view, show `<OwnerPill userId={item.userId} />` next to each entry so the source is obvious.

### Per-user vs household entities (budgets, events)

Both `Budget` and `FinanceEvent` carry a `scope: 'user' | 'household'` plus an optional `userId` (required iff `scope === 'user'`). Their Zod schemas enforce this via `superRefine`:

```ts
export const BudgetSchema = z.object({
  scope: z.enum(['user', 'household']),
  userId: z.string().optional(),
  ...
}).superRefine((data, ctx) => {
  if (data.scope === 'user' && !data.userId) {
    ctx.addIssue({
      code: 'custom',
      path: ['userId'],
      message: 'User scope requires a userId',
    })
  }
})
```

When adding similar scoped entities, follow that shape — it ties cleanly into the scope toggle without new infrastructure.

### Pure status helpers (shared math)

Domains where multiple surfaces compute the same numbers expose a **pure helper** under `src/lib/utils/`:

- `budgetStatus.ts` → `computeBudgetStatuses(budgets, expenses, scope, userId, monthKey)` returns `BudgetStatus[]` used by the dashboard widget, the alert banner on `/expenses`, and the `/budgets` table
- `eventStatus.ts` → `summarizeEvent(event, expenses)` returns `EventSummary` (phase, daysUntil, totalSpent, expenseCount) used by the event card, list page, and detail page

This prevents the classic bug where one surface says "92%" and another says "94%" because they filtered subtly differently. When two surfaces need the same number, **always put the math in a pure helper first**, then call it from both.

### Domain scaffold (worked example)

Adding a new domain — say "loans" — touches these layers in order:

**1. Type** (`src/types/index.ts`)
```ts
export interface Loan {
  id: string
  userId: string
  lender: string
  principal: number
  remaining: number
  startDate: string
  // ...
}
```

**2. Zod schema** (`src/lib/schemas/loan.schema.ts`)
```ts
import { z } from 'zod'
export const LoanSchema = z.object({
  lender: z.string().min(1),
  principal: z.coerce.number().positive(),
  // ...
})
export type LoanInput = z.infer<typeof LoanSchema>
```

**3. Mock seed** (`src/lib/utils/mockData.ts`) — add `MOCK_LOANS: Loan[] = [...]`

**4. Store** (`src/lib/store/useLoanStore.ts`) — mirror `useExpenseStore.ts` exactly:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Loan } from '@/types'
import { nanoid } from 'nanoid'
import { MOCK_LOANS } from '@/lib/utils/mockData'

interface LoanState {
  loans: Loan[]
  addLoan: (loan: Omit<Loan, 'id'>) => void
  updateLoan: (id: string, loan: Partial<Loan>) => void
  deleteLoan: (id: string) => void
}

export const useLoanStore = create<LoanState>()(
  persist((set) => ({
    loans: MOCK_LOANS,
    addLoan: (loan) => set(s => ({ loans: [...s.loans, { ...loan, id: nanoid() }] })),
    updateLoan: (id, loan) => set(s => ({ loans: s.loans.map(l => l.id === id ? { ...l, ...loan } : l) })),
    deleteLoan: (id) => set(s => ({ loans: s.loans.filter(l => l.id !== id) })),
  }), { name: 'loan-storage' })
)
```

**5. Optional util** (`src/lib/utils/loanStatus.ts`) — if multiple surfaces need computed values.

**6. Components** (`src/components/loans/`) — `LoanForm.tsx`, `LoanList.tsx`, `LoanCard.tsx`, etc. Copy structure from `components/budgets/` or `components/events/` depending on whether it's table-shaped or card-shaped.

**7. Page** (`src/app/(dashboard)/loans/page.tsx`) — typically 5 lines:
```tsx
import { Header } from '@/components/layout/Header'
import { LoanList } from '@/components/loans/LoanList'

export default function LoansPage() {
  return (
    <>
      <Header title="Loans" />
      <div className="page-container"><LoanList /></div>
    </>
  )
}
```

**8. Nav** — add to both `Sidebar.tsx` (desktop) and `BottomNav.tsx` (mobile, currently 6 tabs — **swap one don't append**, since 7+ tabs at 320px breaks the 44px tap target).

### Forms

Forms use **react-hook-form** + **Zod v4** schemas. Zod v4 has breaking changes from v3 — when in doubt, check `node_modules/zod/` rather than relying on remembered v3 API.

The canonical form pattern (used by every domain) is a Dialog modal with the editing-or-create dual mode:

```tsx
'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoanSchema, LoanInput } from '@/lib/schemas/loan.schema'

export function LoanForm({ open, onClose, editing }: Props) {
  const { addLoan, updateLoan } = useLoanStore()
  const { currentUser } = useAuthStore()

  const defaultAdd = { /* sensible defaults */ }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoanInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(LoanSchema) as any,
    defaultValues: editing ?? defaultAdd,
  })

  useEffect(() => {
    if (open) reset(editing ?? defaultAdd)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const onSubmit = (data: LoanInput) => {
    if (editing) updateLoan(editing.id, data)
    else addLoan({ ...data, userId: currentUser!.id })
    onClose()
  }

  return ( /* Dialog with form */ )
}
```

Critical comment placement: `// eslint-disable-next-line @typescript-eslint/no-explicit-any` must sit on the line **directly above the `as any`** — placing it on the `useForm({` line above suppresses nothing and triggers an unused-disable warning + the original `any` error. This has been broken and fixed multiple times in this repo.

### Charts

All charts use **Recharts** and pull colors from the centralized palette at `src/lib/charts/theme.ts`:

```ts
import { CHART_COLORS, CATEGORY_COLOR_MAP, INCOME_COLOR, EXPENSE_COLOR,
         SOURCE_COLOR_MAP, NET_COLOR, chartTooltipStyle } from '@/lib/charts/theme'
```

**Never hardcode chart colors** — every prior attempt drifted out of sync across files. The canonical chart shape:

```tsx
<div className="glass-card p-5 space-y-3">
  <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
    Title
  </h3>
  <ResponsiveContainer width="100%" height={210}>
    <BarChart data={data} barSize={12}>
      <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklch, var(--color-foreground) 8%, transparent)" vertical={false} />
      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
      <YAxis ... />
      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={chartTooltipStyle()} />
      <Bar dataKey="Income" fill={INCOME_COLOR} radius={[8,8,0,0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

### UI Stack

- **shadcn/ui** — components vendored into `src/components/ui/`. Do not edit unless required; re-running `bunx shadcn add <component>` overwrites them. Known **local edits** that must be preserved on re-add:
  - `Input` and `SelectTrigger` add `text-foreground` to their className (browsers don't inherit `color` on form controls → invisible text in dark mode without it)
- **Tailwind v4** — CSS-first config in `src/app/globals.css` (no `tailwind.config.js`). Tailwind v4 **silently emits no CSS** for classes referencing undefined `@theme` tokens. Every shadcn token (`popover`, `popover-foreground`, `accent`, `accent-foreground`, `input`, `ring`, `secondary`, `secondary-foreground`, `destructive`, `destructive-foreground`) must be defined in both the `@theme inline` block and the `.dark` override or those components render with no background/border.
- **Fonts** — `Nunito` (body, var `--font-nunito`) + `Fraunces` (display, var `--font-fraunces`) loaded via `next/font/google`. Fraunces is variable; when using `axes`, do **not** pass an explicit `weight` array (Next.js will throw). The `.hero-number` utility uses `font-variation-settings: "SOFT" 100, "opsz" 144` for soft hero numerals.
- **Recharts** — see Charts section above.
- **framer-motion** — used for: dashboard widget entry stagger, `layoutId` morphing on the scope toggle and bottom nav active pill, budget/event progress-bar fill animations, login-page decorative blobs.
- **next-themes** — `defaultTheme="light"`, `enableSystem={false}`. Light is the playful canonical look; dark is a usable but secondary fallback.
- **@tanstack/react-query** (Phase 1+) — `QueryProvider` is mounted in `src/app/layout.tsx` inside `ThemeProvider`. Defaults: `staleTime: 30s`, `refetchOnWindowFocus: false`. Devtools are rendered only in dev. Domain query hooks live under `src/lib/client/hooks/` (none yet; populated in Phase 3+).
- `@/` path alias maps to `./src/`.

**Custom utility classes** in `globals.css`:
- `.soft-card` — solid card surface, low shadow, large radius (preferred for new UI)
- `.glass-card`, `.glass-card-hover` — same surface kept for backwards compatibility; hover variant lifts and rotates slightly
- `.gradient-text` — display gradient for the wordmark (coral → butter → plum)
- `.hero-number` — Fraunces with `font-variation-settings`, used for large currency numbers
- `.candy-tag` — small pill with primary-tinted background
- `.page-container` — standard page padding + vertical gap

### Key conventions

- All `(dashboard)/` pages are `'use client'` (Zustand needs the browser)
- `nanoid` generates IDs for new records (not UUID)
- Currency is INR; always format through `src/lib/utils/formatCurrency.ts`
- Dates stored as ISO strings; use `src/lib/utils/dateHelpers.ts` helpers (`toISODate`, `formatDate`, `daysUntil`, `getLast6Months`)
- The type name `Event` is **avoided** — it shadows the DOM global and causes confusing collisions. The domain type is `FinanceEvent`
- For computed values that multiple surfaces show, put the math in a pure helper under `src/lib/utils/` so widgets, lists, and detail pages can't disagree

## Landmines (in this codebase, by experience)

These have all bitten in prior sessions. Documenting symptoms + fixes so they don't bite again.

### 1. Dropdown is fully transparent / invisible (Tailwind v4)
**Symptom:** A `<Select>` opens but the popover content is invisible against the page background. Or `<Input>` borders are missing.
**Cause:** Tailwind v4 emits no CSS for classes referencing undefined `@theme` tokens. shadcn's `SelectContent` uses `bg-popover`; if `--color-popover` isn't defined, the class produces zero CSS.
**Fix:** Confirm all of these tokens exist in both `@theme inline` and `.dark` blocks in `globals.css`: `popover`, `popover-foreground`, `accent`, `accent-foreground`, `input`, `ring`, `secondary`, `secondary-foreground`, `destructive`, `destructive-foreground`.

### 2. Form-control text is invisible (the color-inheritance trap)
**Symptom (1):** Typing in an `<Input>` produces no visible characters in dark mode. Light mode works fine.
**Symptom (2):** A `<Button variant="outline">` or `variant="ghost">` icon/label is invisible at rest and only becomes visible on hover.
**Cause:** Browsers don't propagate `color: inherit` to form controls (`<input>`, `<button>`, `<select>`) — they fall back to a system color. shadcn's `Input`, `SelectTrigger`, and the `outline`/`ghost` Button variants ship without an explicit text color at rest, so the system color shows through.
**Fix:** Ensure `text-foreground` is in the className of `Input` and `SelectTrigger` in `src/components/ui/input.tsx` and `select.tsx`, and in the `outline` and `ghost` variants of `src/components/ui/button.tsx`. If you re-add via `bunx shadcn add`, re-apply these patches. `default`, `destructive`, and `secondary` button variants already set their own text color and are unaffected.

### 3. `eslint-disable-next-line` doesn't suppress the `any` cast
**Symptom:** Lint reports an `Unexpected any` error on the `as any` line **and** an "unused eslint-disable directive" warning two lines above.
**Cause:** The comment was placed above the `useForm({` opening line; the `as any` is on the next line, so the disable suppresses the wrong line.
**Fix:** Move the comment so it's on the line **immediately above** `resolver: zodResolver(...) as any,`. Example: see any of the existing form files (`ExpenseForm.tsx`, `BudgetForm.tsx`, etc.).

### 4. Build fails with "Axes can only be defined for variable fonts"
**Symptom:** `bun run build` errors with `font_options_from_query_map failed` after editing the Fraunces config.
**Cause:** Passing both `axes: [...]` and `weight: [...]` to `Fraunces` in `next/font/google` is rejected — variable-font axes can't coexist with a fixed-weight array.
**Fix:** Remove `weight` and let Fraunces load as the full variable font.

### 5. Stale data after editing mock seeds
**Symptom:** You changed `MOCK_EXPENSES` in `mockData.ts` but the dashboard still shows the old values.
**Cause:** `persist` middleware hydrated from `localStorage` once and won't re-seed unless the persist key changes.
**Fix:** DevTools → Application → Local Storage → delete `expense-storage` (or the relevant key) and reload. Or bump the `name` argument in `persist()` temporarily.

### 6. Bottom nav cramped at 320px
**Symptom:** Bottom nav labels overlap, tap targets feel too small.
**Cause:** More than 6 tabs at `flex-1` with `px-1.5` reduces tap targets below iOS HIG 44pt minimum.
**Fix:** Swap, don't append. When adding a new top-level destination to the bottom nav, drop a less-used one (e.g. Subs was demoted to sidebar-only when Events was added). Keep the count at 6.

### 7. Table overflows on narrow viewports
**Symptom:** Tables push past the right edge of small phones.
**Cause:** Missing `overflow-x-auto` wrapper around the `<table>`.
**Fix:** Wrap `<table className="... min-w-120">` in `<div className="overflow-x-auto">`. The `min-w` keeps columns readable when scrolled. See `ExpenseTable.tsx` for the canonical setup; `IncomeList` and `BudgetTable` were fixed retroactively. Tailwind v4 prefers the canonical class form (`min-w-120` over `min-w-[480px]`).

### 8. `params` is a Promise in dynamic routes
**Symptom:** Type error on `params.id` in a `[id]/page.tsx`.
**Cause:** Next.js 15+ made `params` a `Promise<{...}>` in server components.
**Fix:** Make the page a client component (`'use client'`) and use `useParams<{ id: string }>()` from `next/navigation`. All dashboard pages need to be client anyway because of Zustand.

### 9. Form submit button is invisible (the phantom `--color-brand-blue`)
**Symptom:** You open a CRUD modal (Expense / Income / Subscription / Grocery), fill it in, but there's no visible "Save" or "Add" button at the bottom — the user thinks the form is broken.
**Cause:** Those four forms had `<Button type="submit" style={{background: 'var(--color-brand-blue)'}}>`, but `--color-brand-blue` was **never defined** in `globals.css` (only `--color-brand-coral` and `--color-brand-plum` exist). The `var()` falls through to nothing, the button renders with no background, and the result is "missing button" against the modal surface. Tailwind v4 + shadcn's reaction to undefined tokens (landmine #1) plus the form-control color-inheritance issue (landmine #2) compound the disappearance.
**Fix:** Use the canonical primary-button pattern that `BudgetForm` and `EventForm` already use:
```tsx
<Button
  type="submit"
  className="flex-1 rounded-2xl font-bold transition-transform active:scale-95"
  style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
>
  {editing ? 'Save' : 'Add X'}
</Button>
```
When migrating a domain, double-check this — it's easy to copy a still-broken form template forward.

### 10. Next 16 renamed `middleware` → `proxy`
**Symptom:** Dev server logs `The "middleware" file convention is deprecated. Please use "proxy" instead.` Then 500s with `The Proxy file "/proxy" must export a function named 'proxy' or a default function.`
**Cause:** Next 16 renamed both the **file convention** (`src/middleware.ts` → `src/proxy.ts`) AND the **exported function name** (`export function middleware` → `export function proxy`). Most blog posts and the @supabase/ssr docs still use the old name.
**Fix:** Rename the file AND the export. After renaming, you may need to `rm -rf .next` because Turbopack caches the old file reference.
