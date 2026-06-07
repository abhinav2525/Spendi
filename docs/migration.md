# Backend migration

This project started as 100% client-side (Zustand + `localStorage`) and is incrementally moving each domain to Supabase Postgres + Drizzle + Next.js Server Actions + TanStack Query.

## Why migrate at all

The original prototype was fine for a single-browser demo, but had three real limitations:
- **No cross-device sync** — opening the app in Chrome and Safari gave two unrelated states.
- **No multi-user collaboration** — every family member had their own siloed `localStorage`.
- **No real auth** — anyone could write `currentUser` into `localStorage` and bypass the "guard."

The end state: data lives in Supabase, three family members share one household, RLS enforces tenancy at the DB.

## Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Infrastructure (Drizzle, postgres.js, Supabase Auth wrapper, TanStack Query provider, seed script, RLS policies) | ✅ Done |
| 2 | Auth cutover (replace `useAuthStore` with Supabase Auth + `useUser()`, server-side guard, sign-out via Server Action) | ✅ Done |
| 3 | Expenses (server actions, query/mutation hooks, refactor all consumers, delete `useExpenseStore`) | ✅ Done |
| 4 | Income | ✅ Done |
| 5 | Subscriptions | ✅ Done |
| 6 | Groceries | ✅ Done |
| 7 | Budgets (including the partial-index upsert) | ✅ Done |
| 8 | Events (including the `endDate >= startDate` Zod + DB rule) | ✅ Done |
| 9 | Final cleanup — retired `scopeFilter.ts`, rewrote the "Add a new domain" worked example and the Forms canonical pattern in CLAUDE.md to reflect the post-migration shape | ✅ Done |

**The migration is complete.** Every domain Zustand store has been deleted; only `useScopeStore` survives as UI state. The README, root CLAUDE.md, and per-folder CLAUDE.md files all describe the post-migration architecture.

The full plan with file-level detail lives at `~/.claude/plans/cosmic-munching-brooks.md`.

## The 5-piece migration template

Every domain follows the same shape. Use the expenses migration as the worked example.

### 1. Server Action file — `src/lib/server/actions/<domain>.ts`

```ts
'use server'

import { and, eq, desc } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { someTable } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { SomeSchema, type SomeInput } from '@/lib/schemas/some.schema'
import type { SomeType } from '@/types'
import type { Scope } from '@/lib/store/useScopeStore'

type Row = typeof someTable.$inferSelect

function rowToSomething(row: Row): SomeType {
  return {
    id: row.id,
    userId: row.userId,
    // ... null → undefined for optionals
  }
}

export async function listSomething(opts: { scope: Scope }): Promise<SomeType[]> {
  const me = await requireMember()
  const filters = [eq(someTable.householdId, me.householdId)]
  if (opts.scope === 'mine') filters.push(eq(someTable.userId, me.id))
  const rows = await db.select().from(someTable).where(and(...filters)).orderBy(desc(someTable.date))
  return rows.map(rowToSomething)
}

export async function createSomething(input: SomeInput): Promise<SomeType> {
  const me = await requireMember()
  const parsed = SomeSchema.parse(input)
  const [row] = await db.insert(someTable).values({
    householdId: me.householdId,
    userId: me.id,
    ...parsed,
  }).returning()
  return rowToSomething(row)
}

export async function updateSomething(id: string, input: Partial<SomeInput>): Promise<SomeType> {
  const me = await requireMember()
  const update: Partial<typeof someTable.$inferInsert> = {}
  if (input.x !== undefined) update.x = input.x
  // ... build conditionally — NEVER spread input directly into .set()
  const [row] = await db.update(someTable)
    .set(update)
    .where(and(eq(someTable.id, id), eq(someTable.householdId, me.householdId)))
    .returning()
  if (!row) throw new Error('not found')
  return rowToSomething(row)
}

export async function deleteSomething(id: string): Promise<void> {
  const me = await requireMember()
  await db.delete(someTable)
    .where(and(eq(someTable.id, id), eq(someTable.householdId, me.householdId)))
}
```

### 2. Client hooks — `src/lib/client/hooks/useSomething.ts`

```ts
'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  listSomething,
  createSomething,
  updateSomething,
  deleteSomething,
} from '@/lib/server/actions/something'
import type { SomeInput } from '@/lib/schemas/some.schema'
import type { Scope } from '@/lib/store/useScopeStore'

export function useSomethingQuery(scope: Scope) {
  return useQuery({
    queryKey: ['something', scope],
    queryFn: () => listSomething({ scope }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateSomething() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SomeInput) => createSomething(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['something'] }),
  })
}

export function useUpdateSomething() { /* same pattern */ }

export function useDeleteSomething() {
  // include the optimistic snapshot/restore pattern from useExpenses.ts
}
```

### 3. Form refactor — `src/components/<domain>/SomethingForm.tsx`

- Replace `useSomethingStore().addX / updateX` with the new mutation hooks.
- **Drop the `userId: currentUser!.id` injection** — server fills it.
- Use `mutation.mutate(payload, { onSuccess: onClose })`.
- (Optionally) disable the submit button with `mutation.isPending`.

### 4. Consumer refactor — every place that reads from the store

- Replace `const { items } = useSomethingStore()` and any `filterByScope(items, scope, ...)` with `const { data: items = [] } = useSomethingQuery(scope)`.
- Cross-store joins (e.g. `BudgetTable` reads budgets + expenses) just compose two queries.
- Pages that don't follow the scope toggle (event detail page) hardcode `useSomethingQuery('household')`.

### 5. Delete the Zustand store — `src/lib/store/useSomethingStore.ts`

`rm` it. Grep first to confirm zero importers.

## Per-domain special cases

Already migrated (look at these as worked examples when migrating a pending domain):
- **Expenses** — Phase 3. The template-setting migration. Has the most consumers (table + 8 dashboard widgets); a good reference for cross-store joins (`BudgetStatusWidget`, `BudgetTable`, event detail page).
- **Income** — Phase 4. Pure template application; demonstrates the same pattern on a smaller surface (table + 3 dashboard widgets).
- **Subscriptions** — Phase 5. Demonstrates handling a nullable text column (`notes`) via the `null` → `undefined` rowToX mapper. Sorted by `renewalDate DESC` instead of `date DESC`.
- **Groceries** — Phase 6. Demonstrates **server-side recomputation of a derived field**: `totalAmount` is computed in the Server Action from `sum(items[].totalPrice)`, not trusted from the client. The Zod schema deliberately omits `totalAmount` so consumers can't pass it. The form's `useFieldArray` + `watch` pattern (with the accepted `react-hooks/incompatible-library` warning) stayed unchanged.
- **Budgets** — Phase 7. Demonstrates **partial-index `INSERT … ON CONFLICT DO UPDATE`** via Drizzle's `onConflictDoUpdate({ target, targetWhere, set })`. The Server Action branches on `scope`: user-scoped upserts target `(householdId, userId, category) WHERE scope = 'user'`, household-scoped upserts target `(householdId, category) WHERE scope = 'household'`. `userId` for user-scoped is forced to the caller's id, ignoring any client value. The list query has no `scope` parameter — it returns all household budgets and consumers filter client-side (the list is small).
- **Events** — Phase 8. Demonstrates **two-layer invariant enforcement** (Zod `superRefine` client-side for friendly errors + DB CHECK constraint server-side as the floor) on the `endDate >= startDate` rule. `createdAt` is server-stamped via Drizzle's `defaultNow()` and converted to ISO string in `rowToEvent`. Deleting an event cascades to `expenses.eventId = NULL` (FK ON DELETE SET NULL), so `useDeleteEvent` invalidates both `['events']` and `['expenses']` caches. Like budgets, `useEventsQuery()` has no scope parameter — `EventList`'s filtering rules are more nuanced than a single `mine` vs `household` query can express.

The domain migration is now complete. **Only Phase 9 (final cleanup) remains:** retire `scopeFilter.ts` (no consumers left), confirm `mockData.ts` is imported only by the server-side seed script, refresh stale references in CLAUDE.md once the cleanup is done.

## Cross-domain joins (don't combine prematurely)

Once expenses is on the server but budgets is still in Zustand, `BudgetStatusWidget` reads budgets from the Zustand store AND expenses from `useExpensesQuery`. That's fine — composing two queries is the right pattern, not a smell.

When budgets is migrated, you'd reach for `useBudgetsQuery(scope)` + `useExpensesQuery(scope)`. **Resist the urge** to write a combined `getDashboardSummary()` Server Action until you're certain it's faster (multiple round-trips usually aren't measurable on a same-region pooler) and the abstraction earns its keep.

## What stays Zustand forever

- `useScopeStore` — UI state, not server state. The "Mine / Household" toggle doesn't come from the server.
- `useThemeStore` (if added) — same.

Anything that's actually domain data should move.

## What stays even after migration

- The Zod schemas in `src/lib/schemas/`. They're shared between forms and Server Actions; one source of truth.
- The pure helpers `budgetStatus.ts` and `eventStatus.ts`. They take raw data and compute derived numbers — works whether the data came from Zustand or TanStack Query. Don't push them server-side just because you can.
- The mock data in `src/lib/utils/mockData.ts`, but only as a **seed source**. The seed script imports it via a server-only path; once all domains migrate, double-check no client-side code still reads from it before deleting.

## Verification per phase

After landing a phase:

1. `bunx tsc --noEmit` clean.
2. `bun lint` clean (3 accepted `watch()` warnings).
3. `bun run build` produces all routes.
4. Manual smoke as each of the three seeded users:
   - Add, edit, delete a row.
   - Toggle Mine/Household.
   - Confirm a second user in a second browser sees the change after refresh.
5. RLS smoke: from the Supabase SQL editor as `authenticated` role with a different user's JWT, confirm cross-household reads return zero rows.
