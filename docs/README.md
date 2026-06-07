# Developer documentation

Deeper reference docs for working on GharKhata. For project overview and quickstart, see the root [`README.md`](../README.md). For conventions Claude Code should follow, see [`CLAUDE.md`](../CLAUDE.md) (root and per-folder).

## Where to find what

| Topic | Doc | When to read |
|---|---|---|
| System design — household model, scope toggle, server actions + TanStack Query data flow, server/client boundary | [`architecture.md`](architecture.md) | First time you sit down to work on this codebase, or when designing a new domain |
| Schema, Drizzle conventions, migrations workflow, RLS policies, the seed script | [`database.md`](database.md) | When changing the schema, writing a Server Action, or debugging an RLS issue |
| Supabase Auth, the cookie shuttle, session refresh proxy, `requireMember()` | [`auth.md`](auth.md) | When touching auth, the `(dashboard)/` layout, or the `proxy.ts` |
| What's migrated vs pending, the 5-piece migration template, roadmap | [`migration.md`](migration.md) | When migrating the next domain (income → subscriptions → groceries → budgets → events) |
| Common errors and the fixes that worked, with symptoms-and-cause format | [`troubleshooting.md`](troubleshooting.md) | When something is broken and you want to skip the diagnostic dance |

## Doc maintenance

These docs describe how the project works **today**. When a phase lands, update [`migration.md`](migration.md) to reflect the new state, and add any new landmines to [`troubleshooting.md`](troubleshooting.md). Architecture / database / auth shouldn't drift much — they describe the durable patterns.

Per-folder `CLAUDE.md` files (under `src/lib/server/db/`, `src/lib/server/actions/`, etc.) are the dense rules-for-Claude versions of the same material. They're auto-loaded when Claude reads files in those folders; humans don't usually need to open them.
