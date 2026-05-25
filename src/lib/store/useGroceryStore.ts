import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GroceryEntry } from '@/types'
import { nanoid } from 'nanoid'

interface GroceryState {
  groceries: GroceryEntry[]
  addGrocery: (entry: Omit<GroceryEntry, 'id'>) => void
  updateGrocery: (id: string, entry: Partial<GroceryEntry>) => void
  deleteGrocery: (id: string) => void
}

export const useGroceryStore = create<GroceryState>()(
  persist(
    (set) => ({
      groceries: [],
      addGrocery: (entry) =>
        set(s => ({ groceries: [...s.groceries, { ...entry, id: nanoid() }] })),
      updateGrocery: (id, entry) =>
        set(s => ({ groceries: s.groceries.map(g => g.id === id ? { ...g, ...entry } : g) })),
      deleteGrocery: (id) =>
        set(s => ({ groceries: s.groceries.filter(g => g.id !== id) })),
    }),
    { name: 'grocery-storage' }
  )
)
