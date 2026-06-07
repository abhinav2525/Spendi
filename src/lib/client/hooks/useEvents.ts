'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '@/lib/server/actions/events'
import type { EventInput } from '@/lib/schemas/event.schema'

/**
 * Returns every event for the caller's household (both scopes).
 * No scope parameter — EventList's filtering is more nuanced than a single
 * `mine` vs `household` query can express, so consumers filter client-side.
 */
export function useEventsQuery() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => listEvents(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EventInput) => createEvent(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EventInput> }) =>
      updateEvent(id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['events'] })
      const snapshots = qc.getQueriesData<unknown[]>({ queryKey: ['events'] })
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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      // Linked expenses had eventId set to NULL on cascade — refresh those too.
      qc.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
