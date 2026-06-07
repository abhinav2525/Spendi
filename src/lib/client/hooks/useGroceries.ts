'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  listGroceries,
  createGrocery,
  updateGrocery,
  deleteGrocery,
} from '@/lib/server/actions/groceries'
import type { GroceryEntryInput } from '@/lib/schemas/grocery.schema'
import type { Scope } from '@/lib/store/useScopeStore'

export function useGroceriesQuery(scope: Scope) {
  return useQuery({
    queryKey: ['groceries', scope],
    queryFn: () => listGroceries({ scope }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateGrocery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GroceryEntryInput) => createGrocery(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['groceries'] }),
  })
}

export function useUpdateGrocery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GroceryEntryInput> }) =>
      updateGrocery(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['groceries'] }),
  })
}

export function useDeleteGrocery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGrocery(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['groceries'] })
      const snapshots = qc.getQueriesData<unknown[]>({ queryKey: ['groceries'] })
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
    onSettled: () => qc.invalidateQueries({ queryKey: ['groceries'] }),
  })
}
