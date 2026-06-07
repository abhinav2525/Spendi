// src/types/index.ts

export type UserRole = 'admin' | 'member'

export interface User {
  id: string
  name: string
  avatar?: string
  role: UserRole
  pin: string
  createdAt: string
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'education'
  | 'other'

export type PaymentMode = 'cash' | 'upi' | 'card' | 'netbanking'

export interface CustomField {
  label: string
  value: string
}

export interface Expense {
  id: string
  userId: string
  amount: number
  category: ExpenseCategory
  description: string
  date: string
  isRecurring: boolean
  recurringPeriod?: 'daily' | 'weekly' | 'monthly'
  tags: string[]
  paymentMode: PaymentMode
  customFields: CustomField[]
  eventId?: string
}

export type EventScope = 'user' | 'household'

export interface FinanceEvent {
  id: string
  scope: EventScope
  userId?: string
  name: string
  emoji: string
  startDate: string
  endDate?: string
  notes?: string
  createdAt: string
}

export interface GroceryItem {
  name: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalPrice: number
}

export interface GroceryEntry {
  id: string
  userId: string
  date: string
  items: GroceryItem[]
  totalAmount: number
  store?: string
  notes?: string
}

export type SubscriptionFrequency = 'monthly' | 'quarterly' | 'annual'

export type SubscriptionCategory =
  | 'entertainment'
  | 'utility'
  | 'productivity'
  | 'health'
  | 'other'

export interface Subscription {
  id: string
  userId: string
  name: string
  amount: number
  frequency: SubscriptionFrequency
  renewalDate: string
  category: SubscriptionCategory
  isActive: boolean
  notes?: string
}

export type BudgetCategory = ExpenseCategory | 'overall'

export type BudgetScope = 'user' | 'household'

export interface Budget {
  id: string
  scope: BudgetScope
  userId?: string
  category: BudgetCategory
  monthlyLimit: number
}

export type IncomeSource =
  | 'salary'
  | 'business'
  | 'freelance'
  | 'bonus'
  | 'other'

export type IncomeFrequency = 'one-time' | 'monthly' | 'quarterly' | 'annual'

export interface Income {
  id: string
  userId: string
  source: IncomeSource
  amount: number
  frequency: IncomeFrequency
  description: string
  date: string
  customFields: CustomField[]
}
