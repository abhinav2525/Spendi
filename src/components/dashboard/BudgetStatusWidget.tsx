'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useBudgetsQuery } from '@/lib/client/hooks/useBudgets'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useUser } from '@/lib/client/hooks/useUser'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { computeBudgetStatuses, BudgetStatus } from '@/lib/utils/budgetStatus'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { Wallet } from 'lucide-react'
import { format } from 'date-fns'

const TIER_COLORS: Record<BudgetStatus['tier'], { bar: string; text: string; track: string }> = {
  safe:    { bar: '#a3e4d7', text: '#1f7a68', track: '#a3e4d733' },
  warning: { bar: '#ffd97d', text: '#9c6f1e', track: '#ffd97d33' },
  over:    { bar: '#ffadad', text: '#a83e3e', track: '#ffadad33' },
}

export function BudgetStatusWidget() {
  const { scope } = useScopeStore()
  const { data: budgets = [] } = useBudgetsQuery()
  const { data: expenses = [] } = useExpensesQuery(scope)
  const { data: currentUser } = useUser()

  const monthKey = format(new Date(), 'yyyy-MM')
  const statuses = computeBudgetStatuses(budgets, expenses, scope, currentUser?.id, monthKey)
    .sort((a, b) => b.percent - a.percent)

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
          Budget Status · {scope === 'household' ? 'Household' : 'Mine'}
        </h3>
        <Link
          href="/budgets"
          className="text-xs font-bold transition-opacity hover:opacity-70"
          style={{color: 'var(--color-primary)'}}
        >
          Manage →
        </Link>
      </div>

      {statuses.length === 0 ? (
        <div className="py-6 text-sm" style={{color: 'var(--color-muted-foreground)'}}>
          No {scope === 'household' ? 'household' : 'personal'} budgets set.{' '}
          <Link href="/budgets" className="font-bold underline" style={{color: 'var(--color-primary)'}}>Set budgets →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map((s, idx) => {
            const c = TIER_COLORS[s.tier]
            const pct = Math.min(100, s.percent)
            return (
              <div key={s.budgetId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 capitalize">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{background: c.track, color: c.text}}
                    >
                      <Wallet size={12} />
                    </span>
                    <span className="font-bold">
                      {s.category === 'overall' ? 'All categories' : s.category}
                    </span>
                  </div>
                  <span className="text-xs font-bold" style={{color: 'var(--color-muted-foreground)'}}>
                    {formatCurrency(Math.round(s.spent))} <span className="opacity-60">/ {formatCurrency(s.limit)}</span>
                  </span>
                </div>
                <div
                  className="h-2.5 rounded-full overflow-hidden"
                  style={{background: c.track}}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: c.bar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: 0.1 + idx * 0.06, ease: [0.34, 1.4, 0.64, 1] }}
                  />
                </div>
                <div className="text-right text-[11px] font-bold" style={{color: c.text}}>
                  {Math.round(s.percent)}%
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
