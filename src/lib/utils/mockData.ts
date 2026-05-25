import { User, Expense, Income, Subscription, GroceryEntry } from '@/types'
import { toISODate } from './dateHelpers'
import { subDays, subMonths, format } from 'date-fns'

export const MOCK_USERS: User[] = [
  { id: 'admin-1', name: 'Rajesh (Admin)', role: 'admin', pin: '1234', createdAt: '2024-01-01' },
  { id: 'member-1', name: 'Priya', role: 'member', pin: '1111', createdAt: '2024-01-01' },
  { id: 'member-2', name: 'Arjun', role: 'member', pin: '2222', createdAt: '2024-01-01' },
]

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', userId: 'admin-1', amount: 450, category: 'food', description: 'Dinner at restaurant', date: toISODate(subDays(new Date(), 1)), isRecurring: false, tags: [], paymentMode: 'upi', customFields: [] },
  { id: 'e2', userId: 'admin-1', amount: 120, category: 'transport', description: 'Auto rickshaw', date: toISODate(subDays(new Date(), 2)), isRecurring: false, tags: [], paymentMode: 'cash', customFields: [] },
  { id: 'e3', userId: 'admin-1', amount: 2500, category: 'utilities', description: 'Electricity bill', date: toISODate(subDays(new Date(), 5)), isRecurring: true, recurringPeriod: 'monthly', tags: ['bill'], paymentMode: 'netbanking', customFields: [] },
  { id: 'e4', userId: 'member-1', amount: 899, category: 'shopping', description: 'Clothes', date: toISODate(subDays(new Date(), 3)), isRecurring: false, tags: [], paymentMode: 'card', customFields: [] },
  { id: 'e5', userId: 'admin-1', amount: 300, category: 'food', description: 'Lunch', date: toISODate(subDays(new Date(), 0)), isRecurring: false, tags: [], paymentMode: 'upi', customFields: [] },
]

export const MOCK_INCOME: Income[] = [
  { id: 'i1', userId: 'admin-1', source: 'salary', amount: 85000, frequency: 'monthly', description: 'Monthly salary', date: toISODate(new Date()), customFields: [] },
  { id: 'i2', userId: 'member-1', source: 'salary', amount: 55000, frequency: 'monthly', description: 'Monthly salary', date: toISODate(new Date()), customFields: [] },
]

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', userId: 'admin-1', name: 'Netflix', amount: 649, frequency: 'monthly', renewalDate: toISODate(subDays(new Date(), -5)), category: 'entertainment', isActive: true },
  { id: 's2', userId: 'admin-1', name: 'Hotstar', amount: 299, frequency: 'monthly', renewalDate: toISODate(subDays(new Date(), -12)), category: 'entertainment', isActive: true },
  { id: 's3', userId: 'admin-1', name: 'Jio Fiber', amount: 999, frequency: 'monthly', renewalDate: toISODate(subDays(new Date(), -2)), category: 'utility', isActive: true },
  { id: 's4', userId: 'admin-1', name: 'Spotify', amount: 119, frequency: 'monthly', renewalDate: toISODate(subDays(new Date(), -20)), category: 'entertainment', isActive: true },
]

export const MOCK_GROCERIES: GroceryEntry[] = [
  {
    id: 'g1', userId: 'admin-1', date: toISODate(subDays(new Date(), 3)),
    store: 'D-Mart', totalAmount: 1850,
    items: [
      { name: 'Rice', quantity: 5, unit: 'kg', pricePerUnit: 60, totalPrice: 300 },
      { name: 'Dal', quantity: 2, unit: 'kg', pricePerUnit: 110, totalPrice: 220 },
      { name: 'Vegetables', quantity: 1, unit: 'lot', pricePerUnit: 350, totalPrice: 350 },
      { name: 'Oil', quantity: 1, unit: 'litre', pricePerUnit: 180, totalPrice: 180 },
      { name: 'Milk', quantity: 10, unit: 'litre', pricePerUnit: 60, totalPrice: 600 },
      { name: 'Atta', quantity: 5, unit: 'kg', pricePerUnit: 40, totalPrice: 200 },
    ],
    notes: 'Monthly stock-up'
  },
]
