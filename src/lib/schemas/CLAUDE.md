# CLAUDE.md — src/lib/schemas

Zod schemas. One file per domain, shared by **react-hook-form** (client) and **Server Actions** (server).

## Conventions

- **`*Schema`** is the Zod object; **`*Input`** (or `*Credentials` etc.) is `z.infer<typeof *Schema>`. Use `*Input` as the form type and Server-Action argument type so both sides agree by construction.
- Use `z.coerce.number()` for numeric form fields (the HTML `<input type="number">` gives you a string). Use `.positive()`, `.min(0)`, etc. for invariants.
- Use `z.enum([...])` for categorical fields. Mirror the same list in `src/lib/server/db/schema.ts` via `pgEnum(...)` — the two are independent sources of truth; if you change one, change the other.
- Defaults via `.default(...)` keep form payloads round-trippable.

## Zod v4 (not v3)

This repo runs **Zod v4** (`package.json`: `"zod": "^4.4.3"`). When in doubt, read `node_modules/zod/`, not your memory of v3.

Notable v4 differences seen in this codebase:
- `z.string().email()` is still there; no `.url()`-style refinement weirdness.
- `superRefine` callback signature is unchanged.
- `safeParse` / `parse` work the same.

The form resolver still uses `@hookform/resolvers/zod` and works with v4.

## The `scope`/`userId` `superRefine` pattern

`Budget` and `FinanceEvent` carry `scope: 'user' | 'household'` and `userId?: string` (required iff `scope === 'user'`). The conditional is enforced both in Zod (for friendlier client errors) and in the DB (as a CHECK constraint). The Zod side:

```ts
.superRefine((data, ctx) => {
  if (data.scope === 'user' && !data.userId) {
    ctx.addIssue({
      code: 'custom',
      path: ['userId'],
      message: 'User scope requires a userId',
    })
  }
})
```

The DB CHECK constraint that mirrors it lives in `src/lib/server/db/migrations/0001_policies.sql`. If you add another scope-conditional domain, write both pieces.

## The `eslint-disable` placement landmine

Form files use `zodResolver(SomeSchema) as any` because the v4 resolver's inferred type isn't quite right yet. The disable comment **must sit on the line directly above the `as any`**, not above the `useForm({` opening:

```ts
const { register, handleSubmit } = useForm<SomeInput>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: zodResolver(SomeSchema) as any,
  defaultValues: editing ?? defaultAdd,
})
```

Placing it above `useForm({` suppresses nothing AND triggers an "unused eslint-disable" warning. This has been broken and fixed multiple times in this repo — see CLAUDE.md landmine #3.

## Don't

- Don't reach for v3 docs/blog posts — Zod v4 has breaking changes.
- Don't write a schema that drifts from the corresponding `src/types/index.ts` interface — they should be substantially the same shape (the type can have a few more fields like server-stamped `id`, `createdAt`).
- Don't duplicate enum values between `auth.schema.ts` and `db/schema.ts` without keeping them in sync — both are sources of truth; one will silently get out of sync.
