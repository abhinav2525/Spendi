'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '@/lib/server/actions/subscriptions'
import type { SubscriptionInput } from '@/lib/schemas/subscription.schema'
import type { Scope } from '@/lib/store/useScopeStore'

export function useSubscriptionsQuery(scope: Scope) {
  return useQuery({
    queryKey: ['subscriptions', scope],
    queryFn: () => listSubscriptions({ scope }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SubscriptionInput) => createSubscription(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })
}

export function useUpdateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SubscriptionInput> }) =>
      updateSubscription(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })
}

export function useDeleteSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['subscriptions'] })
      const snapshots = qc.getQueriesData<unknown[]>({ queryKey: ['subscriptions'] })
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
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })
}
