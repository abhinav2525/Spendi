# Architecture

A working mental model of GharKhata: what the moving parts are, how a request flows, and why a few non-obvious decisions were made.

## The one-paragraph picture

A single family signs into one shared Supabase project. Each person has an `auth.users` row tied 1:1 to a `household_members` row that carries their household. Every domain table (`expenses`, `incomes`, …) has `userId` (who created it) and `householdId` (which family it belongs to). Row-Level Security enforces tenancy at the database, so even a buggy or compromised Server Action can't leak another household's data. The browser talks to TanStack Query, which talks to Server Actions, which talk to Drizzle, which talks to Postgres. Authentication state lives in Supabase-managed cookies; UI state (the "Mine / Household" scope toggle, modal open/closed) lives in Zustand.

## Layered model

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser                                                             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ React components ('use client')                                 │ │
│  │   reads     ──► useXQuery(scope)                                │ │
│  │   writes    ──► useCreateX / useUpdateX / useDeleteX            │ │
│  │   ui state  ──► useScopeStore  (Zustand)                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                            │                                         │
│                  TanStack Query cache                                │
│                            │ network                                 │
└────────────────────────────│─────────────────────────────────────────┘
                             │ cookies, RSC payload
┌────────────────────────────│─────────────────────────────────────────┐
│  Next.js server                                                      │
│                                                                      │
│  ┌─ proxy.ts ────────────────────────────────────────────────────┐   │
│  │   refreshes Supabase session cookie on every request         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│  ┌─ Server Actions ('use server') ─────────────────────────────┐    │
│  │   const me = await requireMember()                          │    │
│  │   const parsed = SomeSchema.parse(input)                    │    │
│  │   db.insert / db.select / db.update / db.delete             │    │
│  │   return rowToX(row)                                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                            │                                         │
│  ┌─ Drizzle ORM ───────────────────────────────────────────────┐    │
│  │   postgres.js → Supabase transaction pooler (port 6543)     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────────────────│─────────────────────────────────────────┘
                             │ TLS
┌────────────────────────────│─────────────────────────────────────────┐
│  Supabase Postgres                                                   │
│   ┌─ auth.users ──────────┐    ┌─ household_members ──┐              │
│   │   id, email, password │ ── │   id (= auth.users)  │              │
│   └───────────────────────┘    │   householdId        │              │
│                                │   name, role          │              │
│                                └──────────────────────┘              │
│   ┌─ expenses / incomes / subscriptions / groceries / budgets / events│
│   │   householdId  (FK)  ───┐                                         │
│   │   userId       (FK)  ───┤   RLS: householdId = current_household  │
│   └───────────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────┘
```

## Key design choices and the reasoning behind them

### 1. Households as a first-class concept, not bolt-on multi-tenancy

Even though there's exactly one family today, every domain row carries `householdId` from day one. Without it, multi-family support requires a migration. With it, RLS isolation is one line per table:

```sql
CREATE POLICY "household_isolation" ON expenses
  FOR ALL USING (householdId = current_household_id());
```

The cost is one extra column per row and `requireMember()` returning a `householdId` field. The payoff is "we'll never have to retrofit tenancy."

### 2. Server Actions over REST or tRPC

Server Actions give us type-safe RPC for free (the function signature IS the contract — no schema generation, no client codegen). The downside is no external HTTP surface — but this is a single-frontend app, so we don't need one. If a mobile client ever shows up, Server Actions can sit behind a thin REST veneer; the business logic doesn't change.

### 3. TanStack Query for server state, Zustand for UI state only

Server state has fundamentally different needs from UI state: deduplication, caching, optimistic updates, invalidation, retry, stale-while-revalidate. TanStack Query is purpose-built for all of that. Zustand stayed for `useScopeStore` because the scope toggle is genuinely UI state (it doesn't come from the server, it just affects what we fetch). The pre-migration domain stores (`useExpenseStore`, etc.) tried to do server-state things with a UI-state tool, which is why optimistic mutations, multi-tab sync, and refresh-after-edit all had to be reinvented per store.

### 4. RLS as a safety net, not the primary control

Server Actions filter explicitly (`eq(table.householdId, me.householdId)`). RLS is the floor — if a Server Action accidentally drops the WHERE clause, the DB still refuses to return cross-household rows. Belt and suspenders.

The Drizzle client connects with the Supabase postgres pooler user, which bypasses RLS — that's why the Server Action's explicit filter matters. RLS guards against **schema-level bugs** (missed policies, forgotten constraints), not against malicious server code.

### 5. The "Mine / Household" toggle is server-side after migration

Pre-Phase-3, every list component called `filterByScope(items, scope, currentUser?.id)` client-side. Post-migration, that filter moves into the Server Action's WHERE clause. The client just passes `scope: 'mine' | 'household'` and trusts the server to honour it.

Side effect: the cache key becomes `['expenses', scope]`, so toggling refetches. `placeholderData: keepPreviousData` keeps the old data visible during the brief refetch — without it the table flashes empty.

### 6. JSONB for embedded arrays, child tables only when justified

`expenses.tags`, `expenses.customFields`, `incomes.customFields`, `grocery_entries.items` are all `jsonb` columns. None of the current UI surfaces query by content inside those arrays. Promoting them to child tables would add foreign keys and joins for zero current benefit.

If a future feature does want "find expenses tagged X," promote `tags` to a child table at that point.

## Request flow examples

### Listing expenses

1. User navigates to `/expenses`.
2. `(dashboard)/layout.tsx` (async server component) calls `await requireMember()` — redirects to `/login` if no session.
3. The expenses page renders the `ExpenseTable` client component.
4. `ExpenseTable` reads `scope` from `useScopeStore` and calls `useExpensesQuery(scope)`.
5. TanStack Query checks its cache; if stale, calls the `listExpenses({ scope })` Server Action over the RSC channel.
6. `listExpenses` calls `requireMember()` (fast — session already verified by middleware) and runs the Drizzle SELECT with WHERE clause.
7. Rows are mapped through `rowToExpense` (DB nulls → public undefineds) and returned.
8. TanStack Query stores the result; the table renders.

### Creating an expense

1. User clicks "Add", types into the modal, clicks "Add Expense".
2. `ExpenseForm.onSubmit` calls `create.mutate(payload, { onSuccess: onClose })`.
3. The `useCreateExpense` mutation fires `createExpense(input)`.
4. Server Action: `requireMember()` → `ExpenseSchema.parse(input)` → `db.insert(...).values({ householdId: me.householdId, userId: me.id, ...parsed }).returning()`.
5. Returns the new row mapped through `rowToExpense`.
6. `onSuccess` closes the modal. `onSettled` invalidates `['expenses']`, which triggers a refetch in any active scope.

### Deleting an expense

1. User clicks the trash icon. `del.mutate(id)` fires.
2. `onMutate` removes the row optimistically from every active expenses cache key (both `['expenses', 'mine']` and `['expenses', 'household']` if both are around).
3. The Server Action runs server-side; if it succeeds, the cache is already correct.
4. If it fails, `onError` restores the snapshot the optimistic update saved.
5. `onSettled` invalidates `['expenses']` either way.

## Where the boundaries are

| Boundary | Enforced by |
|---|---|
| Server-only code → never imported by client | `import 'server-only'` (build fails) in `src/lib/server/**` |
| Auth required → can't reach dashboard pages | `(dashboard)/layout.tsx` calls `requireMember()` |
| Cross-household read → blocked even on Server Action bugs | Postgres RLS policy on every domain table |
| Form input shape → matches server expectation | Same Zod schema imported on both sides; `ExpenseInput = z.infer<...>` is the wire type |

## Where the boundaries aren't (yet)

- **Concurrent edits on the same row.** Two family members editing the same expense at once — last-write-wins, no optimistic locking. Acceptable for a family of three.
- **Realtime sync across tabs.** If Priya edits in browser A, Rajesh in browser B sees the change only after a refetch (every 30s window-focus is off, TanStack Query default). Could add Supabase Realtime later.
- **Audit log.** No row history. Editing or deleting destroys the prior state.

These are explicit "not yet" decisions, not oversights.
