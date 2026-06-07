'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  listBudgets,
  setBudget,
  updateBudget,
  deleteBudget,
} from '@/lib/server/actions/budgets'
import type { BudgetInput } from '@/lib/schemas/budget.schema'

/**
 * Returns every budget for the caller's household — both user-scoped and household-scoped.
 * Consumers filter by `budget.scope` and `budget.userId` client-side; the list is small.
 */
export function useBudgetsQuery() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () => listBudgets(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

/** Upsert on the (scope, userId, category) composite key. */
export function useSetBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetInput) => setBudget(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BudgetInput> }) =>
      updateBudget(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['budgets'] })
      const snapshots = qc.getQueriesData<unknown[]>({ queryKey: ['budgets'] })
      for (const [key, prev] of snapshots) {
        if (Array.isArray(prev)) {
          qc.setQueryData(
            key,
            prev.filter((row) => (row as { id: string }).id !== id),
          )
        }
      }
      return { snapshots }
    },
    onError: (_err, _id, ctx) => {
      if (!ctx) return
      for (const [key, prev] of ctx.snapshots) {
        qc.setQueryData(key, prev)
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
