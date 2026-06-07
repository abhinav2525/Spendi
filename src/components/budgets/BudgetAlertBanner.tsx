'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useBudgetsQuery } from '@/lib/client/hooks/useBudgets'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useUser } from '@/lib/client/hooks/useUser'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { computeBudgetStatuses } from '@/lib/utils/budgetStatus'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { AlertTriangle, X } from 'lucide-react'
import { format } from 'date-fns'

export function BudgetAlertBanner() {
  const { scope } = useScopeStore()
  const { data: budgets = [] } = useBudgetsQuery()
  const { data: expenses = [] } = useExpensesQuery(scope)
  const { data: currentUser } = useUser()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const monthKey = format(new Date(), 'yyyy-MM')
  const flagged = computeBudgetStatuses(budgets, expenses, scope, currentUser?.id, monthKey)
    .filter(s => s.tier !== 'safe')
    .sort((a, b) => b.percent - a.percent)

  if (flagged.length === 0) return null

  const worst = flagged[0]
  const isOver = worst.tier === 'over'
  const label = worst.category === 'overall' ? 'Overall spending' : worst.category
  const style = isOver
    ? { bg: '#ffadad33', border: '#ffadad99', color: '#a83e3e' }
    : { bg: '#ffd97d33', border: '#ffd97d99', color: '#9c6f1e' }

  return (
    <div
      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl text-sm font-medium"
      style={{background: style.bg, border: `1.5px solid ${style.border}`, color: style.color}}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <AlertTriangle size={16} />
        <span className="capitalize">
          <strong>{label}</strong> is at {Math.round(worst.percent)}%{' '}
          <span style={{color: 'var(--color-muted-foreground)'}}>
            ({formatCurrency(Math.round(worst.spent))} / {formatCurrency(worst.limit)})
          </span>
        </span>
        {flagged.length > 1 && (
          <span className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>
            +{flagged.length - 1} more
          </span>
        )}
        <Link href="/budgets" className="underline text-xs ml-1">Manage budgets</Link>
      </div>
      <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100 shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}
