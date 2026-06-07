# Troubleshooting

Symptoms that have hit during development, with the cause and the fix that worked. Skim this when something breaks before diving into a long diagnostic dance.

The root [`CLAUDE.md`](../CLAUDE.md) has a "Landmines" section with the same content, indexed by number. This page is the prose version organised by where you'll encounter each problem.

## Setting up Supabase

### `DATABASE_DIRECT_URL` returns `ENOTFOUND`

```
DNSException: getaddrinfo ENOTFOUND
```

**Cause**: New Supabase projects don't get an IPv4 address on the direct database connection (`db.<ref>.supabase.co`). The hostname literally doesn't resolve on most ISPs.

**Fix**: Use the **Session pooler** URL (same hostname as the transaction pooler but on port `5432`) for `DATABASE_DIRECT_URL`. Find it in the dashboard's "Connect" modal → Session pooler tab. Leave the transaction pooler URL (port `6543`) as `DATABASE_URL`.

### `password authentication failed for user "postgres"`

**Cause**: The password in the connection string is wrong. Common reasons:

1. You copy-pasted before replacing `[YOUR-PASSWORD]` placeholder. *(Not your case if `[ ... ]` doesn't appear in `.env`.)*
2. You forgot or mistyped the password set at project creation.
3. The password contains characters that need URL-encoding.

**Fix**:
- Check for URL-unsafe chars: `@ : / ? # & % [ ] +`. If any appear, URL-encode them (`@` → `%40` etc.) or reset to a password without them.
- If unsure of the password: dashboard → Project Settings → Database → "Reset database password". Copy the new value; update **both** `DATABASE_URL` and `DATABASE_DIRECT_URL`.

### `bun db:migrate` fails immediately with `DATABASE_URL is not set`

**Cause**: `.env` exists but is empty (0 bytes), or you saved into a different file, or the editor didn't actually save.

**Fix**: `wc -c .env` should report ~1000 bytes for a complete config. If 0, save again and verify the editor wrote it. If using a different file (`.env.local`, `.env.development`, etc.), Bun loads `.env` by default — either rename or use the standard `.env`.

### Migration applies but seed fails with `events_end_after_start_chk`

**Cause**: The mock data in `src/lib/utils/mockData.ts` had `endDate < startDate` for the Diwali and Goa events — the client never noticed, but the DB CHECK constraint correctly rejects it.

**Fix**: This was patched in the codebase. If you regenerate mock data, make sure `endDate >= startDate` for every event.

## Dev server

### `The "middleware" file convention is deprecated. Please use "proxy" instead.`

**Cause**: Next 16 renamed the convention from `src/middleware.ts` → `src/proxy.ts` AND the exported function from `middleware` → `proxy`. Most blog posts and the @supabase/ssr docs still use the old name.

**Fix**: Rename the file AND the export. After renaming, `rm -rf .next` because Turbopack caches the old reference.

### `Could not parse module '[project]/src/middleware.ts', file not found`

**Cause**: You renamed `middleware.ts` → `proxy.ts` but Turbopack's compile cache still references the old path.

**Fix**: `rm -rf .next` and restart the dev server.

### Dev server "dies" with exit 143 but the app is still serving

**Cause**: The harness's background-process wrapper got `SIGTERM`'d (probably idle cleanup), but the actual `next dev` process detached and is still running.

**Fix**: `pgrep -fl 'next dev'` to find the live PID. If serving, leave it. If you need to start fresh, `pkill -f 'next dev'`.

## Login and auth

### Logged in but the dashboard immediately bounces to `/login`

**Cause**: One of:
1. The `proxy.ts` cookie shuttle is broken (`request.cookies.set` step missing — Server Components see the old session).
2. `requireMember()` is being called before the proxy ran (won't happen with the default matcher).
3. Cookie domain mismatch (development on localhost should never hit this).

**Fix**: Confirm `proxy.ts` writes to **both** `request.cookies` and `response.cookies` in `setAll`. The dev-log line should show `proxy.ts: <N>ms` on every request — if it's missing, the matcher is excluding the path.

### `Auth.getUser()` returning null even though the cookie is present

**Cause**: The cookie format is being decoded with the wrong `cookieEncoding`, or the cookie expired.

**Fix**: Don't pass `cookieEncoding` to `createServerClient` — the default works. If the cookie is genuinely stale, sign out and sign in again.

## Forms

### "There's no Save / Add button on the form"

**Symptom**: You open Add / Edit modal in ExpenseForm, IncomeForm, SubscriptionForm, or GroceryForm, fill in everything, and there's no visible "Save" or "Add" button at the bottom.

**Cause**: Those four forms used `style={{background: 'var(--color-brand-blue)'}}` on the submit button, but `--color-brand-blue` was **never defined** in `globals.css`. The button renders with no background, which is invisible against the modal surface.

**Fix** (already applied): Use the canonical pattern from `BudgetForm`/`EventForm`:

```tsx
<Button
  type="submit"
  className="flex-1 rounded-2xl font-bold transition-transform active:scale-95"
  style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
>
```

### `Unexpected any` ESLint error on `as any` in a form

**Cause**: The `// eslint-disable-next-line @typescript-eslint/no-explicit-any` is on the wrong line. It must be directly above `resolver: zodResolver(...) as any,`, not above `useForm({`.

**Fix**: Move the comment one line down — directly above the `as any` cast. The pattern in every existing form file is the reference.

## Tailwind v4

### A dropdown is fully transparent / an Input has no border

**Cause**: Tailwind v4 emits **no CSS** for classes referencing undefined `@theme` tokens. The shadcn `SelectContent` uses `bg-popover`; if `--color-popover` isn't defined in both `@theme inline` and `.dark` blocks of `globals.css`, the class is a no-op.

**Fix**: Check all of `popover`, `popover-foreground`, `accent`, `accent-foreground`, `input`, `ring`, `secondary`, `secondary-foreground`, `destructive`, `destructive-foreground` exist in both blocks.

### Input or Button text is invisible in dark mode

**Cause**: Browsers don't propagate `color: inherit` to form controls (`<input>`, `<button>`, `<select>`). shadcn ships some primitives without an explicit text colour at rest, so they fall through to a system colour that's the same as the dark-mode background.

**Fix**: `text-foreground` must be on the className of `Input` (`src/components/ui/input.tsx`), `SelectTrigger` (`select.tsx`), and the `outline` + `ghost` variants of `Button` (`button.tsx`). If you re-run `bunx shadcn add` for any of these, re-apply the patch.

## Database

### Stale data after editing `mockData.ts`

**Cause**: Zustand `persist` middleware hydrated from `localStorage` once and won't re-seed unless the persist key changes.

**Fix**: DevTools → Application → Local Storage → delete the `*-storage` key in question. Or bump the `name` argument on the store's `persist()` call temporarily. (This only applies to **pending-migration** domains — migrated ones don't use localStorage.)

### Drizzle query returns rows but the columns are `undefined`

**Cause**: You added `casing: 'snake_case'` to one of the two configs (`drizzle.config.ts` for drizzle-kit OR the runtime `drizzle()` call) without the other. Queries look for `household_id` but the DB has `householdId` (or vice versa).

**Fix**: Either keep both off (current state) or set both. Picking one means rewriting every column name in the schema or every existing migration — there's no middle ground.

## Dynamic routes

### Type error on `params.id` in a `[id]/page.tsx`

**Cause**: Next 15+ made `params` a `Promise<{...}>` in server components.

**Fix**: Make the page a client component (`'use client'`) and use `useParams<{ id: string }>()` from `next/navigation`. All dashboard pages need to be client anyway because of Zustand for pending-migration domains.

## Build

### `bun run build` fails with `Axes can only be defined for variable fonts`

**Cause**: Both `axes: [...]` and `weight: [...]` were passed to `Fraunces` in `next/font/google`. Variable-font axes can't coexist with a fixed-weight array.

**Fix**: Remove `weight` and let Fraunces load as the full variable font.

## Mobile layout

### Bottom nav cramped at 320px

**Cause**: More than 6 tabs at `flex-1 px-1.5` shrinks the tap targets below iOS HIG 44pt.

**Fix**: Keep the bottom nav at 6 tabs. When adding a new top-level destination, swap one out (demote a less-used tab to sidebar-only).

### Table overflows on small phones

**Cause**: Missing `overflow-x-auto` wrapper around the `<table>`.

**Fix**: Wrap in `<div className="overflow-x-auto">` and add `min-w-N` (where N is a Tailwind width) on the table to keep columns readable while scrolled. `ExpenseTable.tsx` is the canonical setup. Use canonical Tailwind v4 widths (`min-w-120`) over arbitrary ones (`min-w-[480px]`).
