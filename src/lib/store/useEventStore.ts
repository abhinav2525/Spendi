import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FinanceEvent } from '@/types'
import { nanoid } from 'nanoid'
import { MOCK_EVENTS } from '@/lib/utils/mockData'

interface EventState {
  events: FinanceEvent[]
  addEvent: (event: Omit<FinanceEvent, 'id' | 'createdAt'>) => string
  updateEvent: (id: string, event: Partial<FinanceEvent>) => void
  deleteEvent: (id: string) => void
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      events: MOCK_EVENTS,
      addEvent: (event) => {
        const id = nanoid()
        set(s => ({
          events: [...s.events, { ...event, id, createdAt: new Date().toISOString() }],
        }))
        return id
      },
      updateEvent: (id, event) =>
        set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...event } : e) })),
      deleteEvent: (id) =>
        set(s => ({ events: s.events.filter(e => e.id !== id) })),
    }),
    { name: 'event-storage' }
  )
)
