import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Income } from '@/types'
import { nanoid } from 'nanoid'
import { MOCK_INCOME } from '@/lib/utils/mockData'

interface IncomeState {
  incomes: Income[]
  addIncome: (income: Omit<Income, 'id'>) => void
  updateIncome: (id: string, income: Partial<Income>) => void
  deleteIncome: (id: string) => void
}

export const useIncomeStore = create<IncomeState>()(
  persist(
    (set) => ({
      incomes: MOCK_INCOME,
      addIncome: (income) =>
        set(s => ({ incomes: [...s.incomes, { ...income, id: nanoid() }] })),
      updateIncome: (id, income) =>
        set(s => ({ incomes: s.incomes.map(i => i.id === id ? { ...i, ...income } : i) })),
      deleteIncome: (id) =>
        set(s => ({ incomes: s.incomes.filter(i => i.id !== id) })),
    }),
    { name: 'income-storage' }
  )
)
