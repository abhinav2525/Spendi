import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

const MOCK_USERS: User[] = [
  { id: 'admin-1', name: 'Rajesh (Admin)', role: 'admin', pin: '1234', createdAt: '2024-01-01' },
  { id: 'member-1', name: 'Priya', role: 'member', pin: '1111', createdAt: '2024-01-01' },
  { id: 'member-2', name: 'Arjun', role: 'member', pin: '2222', createdAt: '2024-01-01' },
]

interface AuthState {
  currentUser: User | null
  users: User[]
  login: (memberId: string, pin: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: MOCK_USERS,
      login: (memberId, pin) => {
        const user = get().users.find(u => u.id === memberId && u.pin === pin)
        if (user) { set({ currentUser: user }); return true }
        return false
      },
      logout: () => set({ currentUser: null }),
    }),
    { name: 'auth-storage' }
  )
)
