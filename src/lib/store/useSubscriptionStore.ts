import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Subscription } from '@/types'
import { nanoid } from 'nanoid'
import { MOCK_SUBSCRIPTIONS } from '@/lib/utils/mockData'

interface SubscriptionState {
  subscriptions: Subscription[]
  addSubscription: (sub: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, sub: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      subscriptions: MOCK_SUBSCRIPTIONS,
      addSubscription: (sub) =>
        set(s => ({ subscriptions: [...s.subscriptions, { ...sub, id: nanoid() }] })),
      updateSubscription: (id, sub) =>
        set(s => ({ subscriptions: s.subscriptions.map(s2 => s2.id === id ? { ...s2, ...sub } : s2) })),
      deleteSubscription: (id) =>
        set(s => ({ subscriptions: s.subscriptions.filter(s2 => s2.id !== id) })),
    }),
    { name: 'subscription-storage' }
  )
)
