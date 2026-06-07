# CLAUDE.md — src/lib/server/supabase

Supabase Auth helpers used by the App Router server layer. See `/CLAUDE.md` for project-wide context.

## What lives here

- `server.ts` — `createSupabaseServerClient()` wraps `@supabase/ssr`'s `createServerClient` with Next 16's async `cookies()` helper.
- `auth.ts` — `getCurrentUser()`, `getCurrentMember()` (joins to `household_members`), and the `requireMember()` redirect-guard used by every Server Action and the dashboard layout.

## `'server-only'` boundary

Both files are marked `import 'server-only'`. Anything in `src/components/`, `src/lib/client/`, or any `'use client'` file that imports from here will **fail the build**. The browser session lives in cookies; client code should use the `useUser()` hook (`@/lib/client/hooks/useUser`) which calls the `getMe` Server Action.

## `getUser()` vs `getSession()`

We use **`getUser()`**, never `getSession()`. The difference is security, not perf:

- `getSession()` reads the access token straight from the cookie. The user object inside is trusted but the cookie value isn't verified per request — a forged cookie would pass.
- `getUser()` round-trips to Supabase Auth to validate the JWT. ~50ms extra per call. **This is the only API safe for authorization decisions.**

`requireMember()` calls `getUser()` underneath; consumers don't need to think about it.

## Cookie shuttle (`src/proxy.ts`)

The `setAll` cookie callback on `createServerClient` is split across `server.ts` (catches the throw from Server Components) and `proxy.ts` (writes refreshed cookies back to the response). The pattern in `proxy.ts` is load-bearing — see CLAUDE.md landmines #10.

`server.ts`'s `setAll` wraps the `cookieStore.set` call in `try/catch` because Server Components are forbidden from setting cookies; the middleware/proxy handles refresh in that case.

## `requireMember()` vs `requireUser()`

- `getCurrentUser()` — returns the Supabase `auth.users` row (id, email, metadata). Use when you just need to confirm someone is signed in but don't need household context.
- `getCurrentMember()` — joins to `household_members` and returns `{ id, householdId, name, avatar, role, createdAt }`. Use when you need `householdId` or `name` for display.
- `requireMember()` — `getCurrentMember()` with `redirect('/login')` if absent. **This is what 99% of code should call.**

A signed-in `auth.users` row with no matching `household_members` row is possible (the seed creates them together, but a future signup flow might not). `requireMember()` redirects in that case too — there's no useful state for a user not yet attached to a household.

## Don't

- Don't add a `requireMember(...)` that returns optional state — if a caller might be unauthenticated, use `getCurrentMember()` and check for null yourself.
- Don't reach into `auth.users` from the Drizzle layer; we don't manage that table. Read it via the Supabase JS client (admin script) or join through `household_members`.
- Don't memoize / cache the `createSupabaseServerClient()` return value across requests — the cookies are per-request.
