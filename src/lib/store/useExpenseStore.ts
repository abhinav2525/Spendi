import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Expense } from '@/types'
import { nanoid } from 'nanoid'

interface ExpenseState {
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id'>) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  deleteExpense: (id: string) => void
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],
      addExpense: (expense) =>
        set(s => ({ expenses: [...s.expenses, { ...expense, id: nanoid() }] })),
      updateExpense: (id, expense) =>
        set(s => ({ expenses: s.expenses.map(e => e.id === id ? { ...e, ...expense } : e) })),
      deleteExpense: (id) =>
        set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),
    }),
    { name: 'expense-storage' }
  )
)
