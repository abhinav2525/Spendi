# CLAUDE.md — src/lib/client/hooks

TanStack Query hooks that wrap Server Actions. See `/CLAUDE.md` "Migrated domain pattern" for the full template.

## File-per-domain convention

One file per domain (`useExpenses.ts`, `useIncomes.ts`, `useSubscriptions.ts`, `useGroceries.ts`, `useBudgets.ts`, `useUser.ts`, `useHouseholdMembers.ts`, ...). Each file exports:

- `useXQuery(scope)` — `useQuery` wrapper around the `listX` Server Action.
- `useCreateX()` / `useUpdateX()` / `useDeleteX()` — `useMutation` wrappers. Hooks are named for the action, not the side-effect ("CreateExpense", not "ExpenseCreate") so call sites read like English: `const create = useCreateExpense()`.

## Query keys

Use the convention `['<domain>', ...args]`:

- `['expenses', 'mine' | 'household']` — list scoped to user or household.
- `['expenses', id]` — single row lookup (if added later).
- `['me']` — current user; `['household-members']` — peer list.

Mutations invalidate the whole `['<domain>']` prefix on settle so both scope variants refresh: `qc.invalidateQueries({ queryKey: ['<domain>'] })`.

## Query defaults

The root `QueryProvider` sets `staleTime: 30_000` and `refetchOnWindowFocus: false`. Each query can override. **Set `staleTime: Infinity` for identity-style data** that doesn't change without logout (`useUser`). **Set `placeholderData: keepPreviousData`** on lists that toggle between filters (the scope toggle) — without it the table flashes empty for ~200ms on every flip.

## Mutation pattern

```ts
export function useDeleteX() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteX(id),       // ① server action
    onMutate: async (id) => {                       // ② optimistic
      await qc.cancelQueries({ queryKey: ['x'] })
      const snapshots = qc.getQueriesData<unknown[]>({ queryKey: ['x'] })
      for (const [key, prev] of snapshots) {
        if (Array.isArray(prev)) {
          qc.setQueryData(key, prev.filter(r => (r as { id: string }).id !== id))
        }
      }
      return { snapshots }
    },
    onError: (_e, _id, ctx) => {                    // ③ rollback on failure
      if (!ctx) return
      for (const [key, prev] of ctx.snapshots) qc.setQueryData(key, prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['x'] }),  // ④ always refetch
  })
}
```

- **Optimistic delete is cheap and snappy.** Worth implementing for every domain.
- **Optimistic create is awkward** — we don't know the server-assigned `id` yet, and merging the placeholder into a sorted list is fiddly. Skip it; rely on `onSettled` invalidation. The server round-trip is ~200ms locally; users don't notice.
- **Optimistic update** is straightforward (swap the row in place by `id`) and worth doing if you notice latency.

## Form integration

Forms in `src/components/<domain>/XForm.tsx` call `create.mutate(payload, { onSuccess: onClose })`. The `onSuccess` runs before `onSettled`, so the modal closes immediately when the server confirms; the table updates through the cache invalidation that follows.

Mutations expose `isPending` for disabling the submit button:

```tsx
<Button type="submit" disabled={create.isPending}>
  {create.isPending ? 'Saving…' : 'Add Expense'}
</Button>
```

## Don't

- Don't import `db` or anything from `src/lib/server/` — these hooks are client-side. They import the Server Action by name, and Next.js handles the network boundary.
- Don't write query keys as plain strings (`'expenses-mine'`) — array prefixes are how invalidation works.
- Don't try to share a single hook for multiple unrelated server actions; one file per domain keeps invalidation predictable.
- Don't set `refetchOnWindowFocus: true` on heavy queries — the default `false` is intentional.
- Don't optimistically create rows for now (see Mutation pattern, ③) — wait for the invalidation.
