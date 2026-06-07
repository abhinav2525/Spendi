# CLAUDE.md — src/components/ui

shadcn/ui components vendored into the repo. See `/CLAUDE.md` "UI Stack" + landmines #1, #2 for the wider Tailwind v4 context.

## Vendored, not a dependency

These files are owned by the project, not by the `shadcn` package. Re-running `bunx shadcn add <component>` **overwrites them** and silently drops the local edits below. After any re-add, re-apply the patches.

## Local edits that must survive a re-add

| File | Patch | Why |
|---|---|---|
| `input.tsx` | `text-foreground` added to className | Browsers don't propagate `color: inherit` to form controls → invisible text in dark mode |
| `select.tsx` | `text-foreground` added to `SelectTrigger`'s className | Same issue |
| `button.tsx` | `text-foreground` added to `outline` and `ghost` variants | The `default`, `destructive`, and `secondary` variants set their own text colour and are unaffected |

## The Tailwind v4 token requirement

shadcn classes like `bg-popover`, `bg-accent`, `border-input`, `ring`, `bg-secondary`, `bg-destructive`, `text-accent-foreground`, `text-popover-foreground`, `text-secondary-foreground`, `text-destructive-foreground` all reference `@theme` tokens. **If a token isn't defined in both `@theme inline` and the `.dark` override in `src/app/globals.css`, Tailwind emits no CSS for that class** — components render with no background, no border. This is the silent failure mode behind "the dropdown is transparent" and "the input has no border".

Whenever you add a shadcn component that uses a new token (e.g. `bg-card-muted`), add it to `globals.css`.

## Adding a new shadcn component

```bash
bunx shadcn add <component>
```

Then:
1. Check what tokens it uses (grep the new file for `bg-`, `border-`, `text-`, `ring-`).
2. Make sure each is defined in `globals.css`.
3. If the new component is a form control or a button variant, apply the `text-foreground` patch.
4. Smoke test in dark mode — most failures show up there first.

## Don't

- Don't edit these files for cosmetic reasons specific to one consumer. Wrap them or pass className instead.
- Don't remove the `text-foreground` patches above — they're not redundant; they fix real bugs.
- Don't add a `'use client'` to a component that doesn't need it — most shadcn primitives are fine as server components.
