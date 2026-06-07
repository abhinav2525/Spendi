'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/lib/server/actions/expenses'
import type { ExpenseInput } from '@/lib/schemas/expense.schema'
import type { Scope } from '@/lib/store/useScopeStore'

export function useExpensesQuery(scope: Scope) {
  return useQuery({
    queryKey: ['expenses', scope],
    queryFn: () => listExpenses({ scope }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ExpenseInput> }) =>
      updateExpense(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['expenses'] })
      const snapshots = qc.getQueriesData<unknown[]>({ queryKey: ['expenses'] })
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
    onSettled: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}
