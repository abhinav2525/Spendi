'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  listIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from '@/lib/server/actions/incomes'
import type { IncomeInput } from '@/lib/schemas/income.schema'
import type { Scope } from '@/lib/store/useScopeStore'

export function useIncomesQuery(scope: Scope) {
  return useQuery({
    queryKey: ['incomes', scope],
    queryFn: () => listIncomes({ scope }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IncomeInput) => createIncome(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['incomes'] }),
  })
}

export function useUpdateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<IncomeInput> }) =>
      updateIncome(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['incomes'] }),
  })
}

export function useDeleteIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['incomes'] })
      const snapshots = qc.getQueriesData<unknown[]>({ queryKey: ['incomes'] })
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
    onSettled: () => qc.invalidateQueries({ queryKey: ['incomes'] }),
  })
}
