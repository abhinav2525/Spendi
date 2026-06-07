# Database

Everything about the Postgres layer: schema, migrations, RLS, the seed script. For the deeper "why" of certain choices, see [`architecture.md`](architecture.md).

## Tables and relationships

```
auth.users (Supabase-managed)
   │ 1:1 via id
   ▼
household_members ──── many:1 ──► households
   │ 1:many
   ├─► expenses          ◄──── eventId (nullable) ──► events
   ├─► incomes
   ├─► subscriptions
   ├─► grocery_entries
   ├─► budgets           (also has scope = 'household' rows with userId = NULL)
   └─► events            (also has scope = 'household' rows with userId = NULL)
```

Every domain row carries both `householdId` and `userId` (except household-scoped budgets and events, where `userId` is NULL).

## Column conventions

- **IDs**: `uuid` with `gen_random_uuid()` default. The exception is `household_members.id`, which mirrors `auth.users.id` (set by the seed / signup flow).
- **Naming**: **camelCase column names** (`householdId`, `userId`, `createdAt`). Drizzle infers them from the JS property names because we don't set `casing: 'snake_case'`. If you set that override on one of the two configs (drizzle-kit's `drizzle.config.ts` or the runtime `drizzle()` call) without the other, queries silently fail.
- **Currency**: `numeric(12, 2)` with `mode: 'number'` in Drizzle, so $inferSelect gives `number` not `string`.
- **Dates**: `date` columns with `mode: 'string'` to preserve the existing ISO-string contract in `src/types/index.ts`.
- **Timestamps**: `timestamp with time zone` defaulting to `now()`; Drizzle returns as `Date`.
- **Cascade chain**: deleting an `auth.users` row cascades to `household_members`, which cascades to every domain row.
- **JSONB**: `expenses.tags` (string[]), `expenses.customFields` ({label,value}[]), `incomes.customFields`, `grocery_entries.items`. Stored with `.$type<...>()` for compile-time safety.

## Migrations

### Two kinds of migration files

1. **Auto-generated** (`0000_initial_schema.sql`, future `0NNN_*.sql`) — produced by `drizzle-kit generate` from the diff between `schema.ts` and the previous snapshot. Drizzle tracks them in `meta/_journal.json`.
2. **Hand-written** (`0001_policies.sql`, future custom files) — for things Drizzle can't express: RLS policies, scope-conditional CHECK constraints, partial unique indexes, `SECURITY DEFINER` functions. Scaffold these via `drizzle-kit generate --custom --name <descriptive>` so they end up in the journal.

### Day-to-day workflow

```bash
# 1. Edit src/lib/server/db/schema.ts
# 2. Generate the diff SQL
bun db:generate

# 3. Inspect the generated file. If wrong, edit schema.ts and regenerate.
#    (delete the new migration + revert journal entries first)

# 4. Apply
bun db:migrate
```

### Custom SQL migrations

```bash
bunx drizzle-kit generate --custom --name policies
# → creates 0NNN_policies.sql with "-- Custom SQL migration file, put your code below!"
# → adds it to meta/_journal.json automatically
```

Edit the file. `bun db:migrate` will pick it up on the next run.

### What NOT to do

- Don't hand-author `.sql` files outside `migrations/` — the migrator only reads files referenced in the journal.
- Don't edit an already-applied migration on a shared DB — write a new one.
- Don't drop and recreate enums; add new values via `ALTER TYPE x ADD VALUE 'new'`.

## RLS policies

Every domain table has Row-Level Security enabled with a household-isolation policy:

```sql
CREATE POLICY "household_isolation" ON expenses
  FOR ALL TO authenticated
  USING ("householdId" = public.current_household_id())
  WITH CHECK ("householdId" = public.current_household_id());
```

`current_household_id()` is a `SECURITY DEFINER` SQL function that looks up `household_members.householdId WHERE id = auth.uid()`. Without `SECURITY DEFINER`, that lookup would recurse through `household_members`'s own RLS policy. The function also has `SET search_path = public` — that's a hardening measure that must travel with `SECURITY DEFINER` everywhere.

### The Drizzle client bypasses RLS

Our Drizzle client connects via the Supabase postgres pooler user — which is a superuser and bypasses RLS. That's intentional: Server Actions are the trusted gateway, and they filter explicitly with `WHERE householdId = me.householdId`. RLS is a backstop for schema bugs (forgotten WHERE clauses, missed policies), not the primary access control.

If we ever wanted RLS to fire from Drizzle too, we'd need to `SET LOCAL ROLE authenticated` per query and seed the JWT claims — significantly more complex for a marginal safety gain over what `requireMember()` already provides.

## Custom constraints

Beyond what Drizzle generates, `0001_policies.sql` adds:

| Constraint | Reason |
|---|---|
| `household_members.id` FK → `auth.users.id ON DELETE CASCADE` | Tie the profile to the auth row; deleting the auth user wipes everything they own |
| `budgets.scope_user_chk` CHECK | `scope = 'user'` requires non-null `userId`; `scope = 'household'` requires NULL `userId` |
| `events.scope_user_chk` CHECK | Same shape as budgets |
| `events.end_after_start_chk` CHECK | `endDate IS NULL OR endDate >= startDate` (mirrors the Zod `superRefine`) |
| `budgets_user_scope_unique` | Partial unique index on `(householdId, userId, category) WHERE scope = 'user'` |
| `budgets_household_scope_unique` | Partial unique index on `(householdId, category) WHERE scope = 'household'` |

The two partial budget indexes implement the `setBudget` upsert key. Postgres `UNIQUE` treats `NULL` as distinct, so a single index can't enforce the constraint across both scopes — splitting it into two `WHERE`-filtered indexes is the canonical workaround.

## The seed script (`bun db:seed`)

`src/lib/server/db/seed.ts` does, in order:

1. **Create three Supabase Auth users** (`rajesh@gharkhata.local`, `priya@gharkhata.local`, `arjun@gharkhata.local`, all password `gharkhata-dev-1234`) via the admin API. **Idempotent**: if a user already exists, the seed reuses it. UUIDs from this step are captured in `idMap`.
2. **`TRUNCATE` all domain tables** (`households`, `household_members`, all 6 domain tables) with `RESTART IDENTITY CASCADE`. This wipes domain data but leaves `auth.users` intact, so existing logged-in sessions still work.
3. **Insert one household** named "GharKhata Demo".
4. **Insert `household_members`** mapping the seed users into the household.
5. **Insert events first** (because expenses can reference them via `eventId`). Tracks `eventIdMap` from mock IDs to UUIDs.
6. **Insert expenses, incomes, subscriptions, groceries, budgets** with `userId` and `householdId` filled in.

### Caveats

- **Truncation is destructive.** Don't run `bun db:seed` against a DB with manual changes you care about.
- **The seed needs the `SUPABASE_SERVICE_ROLE_KEY`.** That key is RLS-bypassing; never expose it client-side.
- **The seed connects via `DATABASE_DIRECT_URL`** (session-pooler URI) — direct user connection, can hold advisory locks if needed.

## Inspecting the DB

```bash
bun db:studio   # opens drizzle-kit's Studio in the browser
```

Or use the Supabase dashboard's Table Editor (login → your project → Table Editor). For ad-hoc queries, the SQL Editor in the dashboard.

When testing RLS from the dashboard, switch the role dropdown in the SQL Editor from `postgres` (superuser, sees everything) to `authenticated` and use `set local request.jwt.claim.sub = '<uuid>'` to impersonate a specific user.
