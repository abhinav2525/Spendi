'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useExpensesQuery, useDeleteExpense } from '@/lib/client/hooks/useExpenses'
import { useEventsQuery } from '@/lib/client/hooks/useEvents'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Search, Plus } from 'lucide-react'
import { ExpenseForm } from './ExpenseForm'
import { OwnerPill } from '@/components/layout/OwnerPill'
import { BudgetAlertBanner } from '@/components/budgets/BudgetAlertBanner'
import { Expense } from '@/types'
import { format } from 'date-fns'

import { CATEGORY_COLOR_MAP } from '@/lib/charts/theme'

function pillStyle(category: string) {
  const color = CATEGORY_COLOR_MAP[category] ?? CATEGORY_COLOR_MAP.other
  return { bg: `${color}33`, color, border: `${color}66` }
}

export function ExpenseTable() {
  const { scope } = useScopeStore()
  const { data: expenses = [] } = useExpensesQuery(scope)
  const { data: events = [] } = useEventsQuery()
  const del = useDeleteExpense()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Expense | undefined>()
  const [showForm, setShowForm] = useState(false)

  const eventById = new Map(events.map(ev => [ev.id, ev]))

  const thisMonthTotal = expenses
    .filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, e) => sum + e.amount, 0)

  const filtered = expenses
    .filter(e => e.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <BudgetAlertBanner />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color: 'var(--color-muted-foreground)'}} />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm whitespace-nowrap" style={{color: 'var(--color-muted-foreground)'}}>
          This month: <span className="font-bold" style={{color: 'var(--color-expense)'}}>{formatCurrency(thisMonthTotal)}</span>
        </div>
        <Button
          className="rounded-2xl font-bold transition-transform active:scale-95"
          style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
          onClick={() => { setEditing(undefined); setShowForm(true) }}
        >
          <Plus size={16} className="mr-1.5" /> Add
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Description</th>
                <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Category</th>
                <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Date</th>
                <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Mode</th>
                <th className="text-right px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const meta = pillStyle(e.category)
                return (
                  <tr key={e.id} className="transition-colors hover:bg-[color-mix(in_oklch,var(--color-muted)_55%,transparent)]" style={{borderBottom: '1px solid var(--color-border)'}}>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{e.description}</span>
                        {scope === 'household' && <OwnerPill userId={e.userId} />}
                        {e.eventId && eventById.has(e.eventId) && (
                          <Link
                            href={`/events/${e.eventId}`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider transition-opacity hover:opacity-80"
                            style={{
                              background: 'color-mix(in oklch, var(--color-primary) 12%, transparent)',
                              color: 'var(--color-primary)',
                              borderColor: 'color-mix(in oklch, var(--color-primary) 30%, transparent)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{eventById.get(e.eventId)!.emoji}</span>
                            <span className="truncate max-w-25">{eventById.get(e.eventId)!.name}</span>
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] font-bold capitalize px-2.5 py-1 rounded-full border"
                        style={{background: meta.bg, color: meta.color, borderColor: meta.border}}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-xs uppercase" style={{color: 'var(--color-muted-foreground)'}}>{e.paymentMode}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{color: 'var(--color-expense)'}}>{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditing(e); setShowForm(true) }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={() => del.mutate(e.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center" style={{color: 'var(--color-muted-foreground)'}}>
                    {search ? 'No expenses match your search' : 'No expenses yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseForm open={showForm} onClose={() => { setShowForm(false); setEditing(undefined) }} editing={editing} />
    </div>
  )
}
