# Authentication

How sessions, cookies, and the auth guard work.

## The model

- **Identity** lives in Supabase Auth (`auth.users` — email, password, JWT). One row per family member.
- **Profile** lives in our `household_members` table — same `id` as `auth.users`, plus `householdId`, display `name`, role, avatar.
- **`requireMember()`** is the canonical "who's calling" helper — it joins those two and returns the merged record. Every Server Action and the dashboard layout call it.

## Login flow

```
Browser /login                Next.js                          Supabase Auth
    │                            │                                    │
    │ submit email/password      │                                    │
    │───────────────────────────►│                                    │
    │                            │  signInWithCredentials() action    │
    │                            │  → safeParse Zod                   │
    │                            │  → supabase.auth                   │
    │                            │      .signInWithPassword(input)    │
    │                            │────────────────────────────────────►
    │                            │                                    │
    │                            │  ◄── sets cookie via setAll       │
    │                            │                                    │
    │                            │  revalidatePath('/', 'layout')     │
    │                            │                                    │
    │ ◄────────────  { ok: true }                                    │
    │                                                                 │
    │ router.push('/dashboard')                                       │
    │                                                                 │
    │ GET /dashboard             │                                    │
    │───────────────────────────►│                                    │
    │                            │  proxy.ts → getUser() refreshes    │
    │                            │   cookie if needed                 │
    │                            │  layout.tsx → requireMember()      │
    │                            │   → redirects /login if absent     │
    │                            │   else renders the dashboard       │
    │ ◄──────── HTML             │                                    │
```

## Session refresh proxy (`src/proxy.ts`)

Every request that lands on a Next.js route runs through `proxy.ts` first. It does one thing: refresh the Supabase session cookie if it's near expiry, and write the refreshed cookie back to the response.

The cookie-shuttle pattern is load-bearing:

```ts
const supabase = createServerClient(url, anonKey, {
  cookies: {
    getAll() { return request.cookies.getAll() },
    setAll(toSet, headers) {
      for (const { name, value } of toSet) {
        request.cookies.set(name, value)           // ① downstream Server Components see the refreshed token
      }
      response = NextResponse.next({ request })
      for (const { name, value, options } of toSet) {
        response.cookies.set(name, value, options) // ② browser receives the refreshed cookie
      }
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value)         // ③ Cache-Control headers prevent CDN caching of auth responses
        }
      }
    },
  },
})

await supabase.auth.getUser()  // triggers the refresh + the setAll callback
return response
```

Skipping ① means Server Components on this request render with the **old** session — "logged in but acts logged out" bugs.
Skipping ② means the browser keeps the old cookie — refresh works on this request but the next one starts stale.
Skipping ③ means the response could be cached by a CDN (Vercel Edge, Cloudflare) and one user's `Set-Cookie` could leak to another.

The proxy is **a no-op when Supabase env vars are missing** — handy during partial migrations and for running the dev server before Supabase is wired up.

### Next 16 naming

The file is `src/proxy.ts` and the exported function is `proxy`, not `middleware`. Next 16 renamed the convention; using the old names produces a deprecation warning then a 500 in dev. The `@supabase/ssr` docs and most blog posts still show the old name.

## Server-side guard: `requireMember()`

`(dashboard)/layout.tsx` is an `async` server component whose first line is:

```ts
await requireMember()
```

`requireMember()`:
1. Creates a request-scoped `createSupabaseServerClient` (reads cookies from `next/headers`).
2. Calls `supabase.auth.getUser()` — this round-trips to Supabase to **verify** the JWT, not just decode it.
3. Joins to `household_members` via Drizzle.
4. Returns the merged record or `redirect('/login')`.

The redirect is server-side, so the user never sees a flash of unauthenticated content.

### `getUser()` vs `getSession()`

We use `getUser()` exclusively. The difference is security:

- `getSession()` reads the access token from the cookie. Whatever's in the cookie is trusted — a forged cookie passes.
- `getUser()` round-trips to Supabase to validate. ~50ms extra per call, but it's the only API safe for authorization.

## Sign-out

The Sidebar logout is a `<form action={signOut}>` that posts to the `signOut` Server Action:

```ts
export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

Form submission is progressive — works without JS. No `useRouter`, no `useTransition`, no `onClick` handler.

## Client-side `useUser()` hook

For client components that need the current member reactively (avatar initial in `Header`, name in `Sidebar`), there's a `useUser()` hook:

```ts
export function useUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),       // Server Action under the hood
    staleTime: Infinity,           // identity doesn't change without logout
    retry: false,
  })
}
```

`getMe()` is just `requireMember()` exposed as a Server Action. `staleTime: Infinity` because the identity doesn't change within a session — the cache is invalidated only when the session itself changes.

The household-members peer list has its own hook:

```ts
export function useHouseholdMembers() {
  return useQuery({
    queryKey: ['household-members'],
    queryFn: () => listHouseholdMembers(),
    staleTime: 5 * 60 * 1000,
  })
}
```

`OwnerPill` uses this to map `userId` → display name.

## Seeded accounts

The seed script creates three users in Supabase Auth:

| Email | Password | Role |
|---|---|---|
| `rajesh@gharkhata.local` | `gharkhata-dev-1234` | admin |
| `priya@gharkhata.local` | `gharkhata-dev-1234` | member |
| `arjun@gharkhata.local` | `gharkhata-dev-1234` | member |

All three belong to the same `households` row. Toggling the scope switch between "Mine" and "Household" shows different subsets.

## What we deliberately don't do

- **No magic links / OAuth / passkeys.** Email + password only. Could change after the migration finishes.
- **No email verification.** The seed creates users with `email_confirm: true` — production would want to flip this and add a confirm-email step.
- **No password reset UI.** Supabase has the backend for it; we just haven't built the form.
- **No multi-household membership.** A user belongs to exactly one household, enforced by `household_members.id` being the primary key.
