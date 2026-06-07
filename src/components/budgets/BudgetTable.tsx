'use client'
import { useState } from 'react'
import { useBudgetsQuery, useDeleteBudget } from '@/lib/client/hooks/useBudgets'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useUser } from '@/lib/client/hooks/useUser'
import { computeBudgetStatuses, BudgetStatus } from '@/lib/utils/budgetStatus'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { BudgetForm } from './BudgetForm'
import { Budget, BudgetScope } from '@/types'
import { format } from 'date-fns'

const TIER_STYLE: Record<BudgetStatus['tier'], { bg: string; color: string; border: string }> = {
  safe:    { bg: '#a3e4d733', color: '#1f7a68', border: '#a3e4d799' },
  warning: { bg: '#ffd97d33', color: '#9c6f1e', border: '#ffd97d99' },
  over:    { bg: '#ffadad33', color: '#a83e3e', border: '#ffadad99' },
}

interface Props {
  scope: BudgetScope
}

export function BudgetTable({ scope }: Props) {
  const viewScope = scope === 'household' ? 'household' : 'mine'
  const { data: budgets = [] } = useBudgetsQuery()
  const del = useDeleteBudget()
  const { data: expenses = [] } = useExpensesQuery(viewScope)
  const { data: currentUser } = useUser()
  const [editing, setEditing] = useState<Budget | undefined>()
  const [showForm, setShowForm] = useState(false)

  const monthKey = format(new Date(), 'yyyy-MM')
  const statuses = computeBudgetStatuses(budgets, expenses, viewScope, currentUser?.id, monthKey)
  const byId = new Map(statuses.map(s => [s.budgetId, s]))

  const rows = budgets.filter(b => {
    if (b.scope !== scope) return false
    if (scope === 'user') return b.userId === currentUser?.id
    return true
  })

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
          {scope === 'household' ? 'Household budgets' : 'Your budgets'}
        </h2>
        <Button
          size="sm"
          className="rounded-2xl font-bold transition-transform active:scale-95"
          style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
          onClick={() => { setEditing(undefined); setShowForm(true) }}
        >
          <Plus size={14} className="mr-1.5" /> Add
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{color: 'var(--color-muted-foreground)'}}>
            No {scope === 'household' ? 'household' : 'personal'} budgets set
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-140">
            <thead>
              <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Category</th>
                <th className="text-right px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Limit</th>
                <th className="text-right px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Spent (this month)</th>
                <th className="px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(b => {
                const status = byId.get(b.id)
                const tier = status?.tier ?? 'safe'
                const style = TIER_STYLE[tier]
                return (
                  <tr key={b.id} className="transition-colors hover:bg-[color-mix(in_oklch,var(--color-muted)_55%,transparent)]" style={{borderBottom: '1px solid var(--color-border)'}}>
                    <td className="px-4 py-3 capitalize font-medium">
                      {b.category === 'overall' ? 'All categories' : b.category}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(b.monthlyLimit)}</td>
                    <td className="px-4 py-3 text-right" style={{color: style.color}}>
                      {formatCurrency(Math.round(status?.spent ?? 0))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border inline-block"
                        style={{background: style.bg, color: style.color, borderColor: style.border}}
                      >
                        {Math.round(status?.percent ?? 0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(b); setShowForm(true) }}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => del.mutate(b.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <BudgetForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined) }}
        scope={scope}
        editing={editing}
      />
    </section>
  )
}
