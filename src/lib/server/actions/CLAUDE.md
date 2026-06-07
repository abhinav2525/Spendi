# CLAUDE.md — src/lib/server/actions

Next.js Server Actions for each migrated domain. See `/CLAUDE.md` "Migrated domain pattern" for the full template.

## The contract

Every file in here is a **server-side RPC surface called from React components via TanStack Query** (`useXQuery` / `useXMutation` hooks in `src/lib/client/hooks/`). Each action runs in a per-request server context with access to:

- The Supabase session via cookies (`createSupabaseServerClient()`)
- The Drizzle `db` instance (`@/lib/server/db/client`)
- Server-only env vars

Actions are **invoked from the browser** through Next's RPC encoding — assume the payload was constructed by a potentially-untrusted client.

## Mandatory pattern

```ts
'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { someTable } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { SomeSchema, type SomeInput } from '@/lib/schemas/some.schema'

export async function createSomething(input: SomeInput) {
  const me = await requireMember()              // ① auth first
  const parsed = SomeSchema.parse(input)        // ② re-validate (don't trust client)
  const [row] = await db.insert(someTable).values({
    householdId: me.householdId,                // ③ server fills tenancy
    userId: me.id,                              //    NEVER from input
    ...parsed,
  }).returning()
  return rowToSomething(row)                    // ④ map nulls → undefined
}
```

### ① Auth first
**Every action's first line is `const me = await requireMember()`** (or `requireUser()` for actions that don't need household context). It redirects to `/login` if there's no session. After this call, `me.id` is the verified Supabase user id and `me.householdId` is theirs.

### ② Re-validate input
The form already ran `zodResolver(SomeSchema)` client-side, but the request hit the network and could have been crafted. Run `SomeSchema.parse(input)` (or `safeParse`) again. Throwing here returns a 500 to the client; for friendlier UX use `safeParse` and return `{ ok: false, message }`.

### ③ Server fills `userId` and `householdId`
**Never read `userId` or `householdId` from the input payload.** Even if a consumer passes it, ignore it and use `me.id` / `me.householdId`. The forms in `src/components/<domain>/` were updated to stop injecting `currentUser.id` — keep them that way.

### ④ WHERE-clause defence-in-depth
For `update` and `delete`, include `eq(table.householdId, me.householdId)` in the WHERE in addition to `eq(table.id, id)`. RLS would already catch a cross-household attempt, but this makes the query self-explanatory and survives an accidental policy disable.

### ⑤ Return mapped rows
DB rows have `null` for optional fields; the public `Expense`/`Income`/... types in `src/types/index.ts` use `undefined`. Each domain has a `rowToX` helper at the top of its action file that maps nulls → undefined. Use it on every return value — consumers expect the public shape.

## Scope filtering (mine vs household)

The client passes `scope: 'mine' | 'household'` (from `useScopeStore`). Server filters:

```ts
const filters = [eq(table.householdId, me.householdId)]
if (opts.scope === 'mine') filters.push(eq(table.userId, me.id))
const rows = await db.select().from(table).where(and(...filters))
```

`household` returns all rows in the household; `mine` narrows to the caller. The client no longer calls `filterByScope` after migration — it's all server-side.

## Updates: build the partial conditionally

```ts
const update: Partial<typeof table.$inferInsert> = {}
if (input.x !== undefined) update.x = input.x
if (input.y !== undefined) update.y = input.y ?? null  // explicit null for nullable
```

**Do NOT spread the input directly into `.set({})`** — Drizzle treats missing keys differently from `undefined` values, and you can accidentally null out unrelated columns.

## RLS bypass

The Drizzle client uses Supabase's postgres pooler with the `postgres.<projectref>` user, which is a superuser — **it bypasses RLS**. That's why the WHERE-clause guard above matters. RLS is the floor under Server Actions, not the ceiling.

## Don't

- Don't trust any field that should belong to the caller (`userId`, `householdId`, `role`) — overwrite from `requireMember()`.
- Don't `await db.update(...).set(input)` — see "Updates" above.
- Don't call `revalidatePath` for routes that flow through TanStack Query — the hooks handle invalidation. Use `revalidatePath` only if a Server Component on a different route reads the same data.
- Don't import anything from `src/lib/client/` into this folder.
