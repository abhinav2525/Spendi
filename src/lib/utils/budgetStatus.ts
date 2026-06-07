import { Budget, Expense, BudgetCategory } from '@/types'
import { Scope } from '@/lib/store/useScopeStore'

export type BudgetTier = 'safe' | 'warning' | 'over'

export interface BudgetStatus {
  budgetId: string
  category: BudgetCategory
  limit: number
  spent: number
  percent: number
  tier: BudgetTier
}

function tierOf(percent: number): BudgetTier {
  if (percent >= 100) return 'over'
  if (percent >= 80) return 'warning'
  return 'safe'
}

export function computeBudgetStatuses(
  budgets: Budget[],
  expenses: Expense[],
  scope: Scope,
  currentUserId: string | undefined,
  monthKey: string,
): BudgetStatus[] {
  const budgetScope = scope === 'household' ? 'household' : 'user'
  const relevant = budgets.filter(b => {
    if (b.scope !== budgetScope) return false
    if (budgetScope === 'user') return b.userId === currentUserId
    return true
  })

  // `expenses` is already scope-filtered by the caller (server-side via
  // useExpensesQuery(scope)), so we only narrow by month here.
  const monthExpenses = expenses.filter(e => e.date.startsWith(monthKey))

  return relevant.map(b => {
    const spent = b.category === 'overall'
      ? monthExpenses.reduce((sum, e) => sum + e.amount, 0)
      : monthExpenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0)
    const percent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0
    return {
      budgetId: b.id,
      category: b.category,
      limit: b.monthlyLimit,
      spent,
      percent,
      tier: tierOf(percent),
    }
  })
}
