import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Scope = 'mine' | 'household'

interface ScopeState {
  scope: Scope
  setScope: (scope: Scope) => void
}

export const useScopeStore = create<ScopeState>()(
  persist(
    (set) => ({
      scope: 'mine',
      setScope: (scope) => set({ scope }),
    }),
    { name: 'scope-storage' }
  )
)
