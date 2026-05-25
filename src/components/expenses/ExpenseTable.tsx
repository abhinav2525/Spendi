'use client'
import { useState } from 'react'
import { useExpenseStore } from '@/lib/store/useExpenseStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Search, Plus } from 'lucide-react'
import { ExpenseForm } from './ExpenseForm'
import { Expense } from '@/types'
import { format } from 'date-fns'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  food:          { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  transport:     { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  utilities:     { bg: 'rgba(234,179,8,0.15)',   color: '#facc15' },
  entertainment: { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa' },
  shopping:      { bg: 'rgba(236,72,153,0.15)',  color: '#f472b6' },
  health:        { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  education:     { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  other:         { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
}

export function ExpenseTable() {
  const { expenses, deleteExpense } = useExpenseStore()
  const { currentUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Expense | undefined>()
  const [showForm, setShowForm] = useState(false)

  const myExpenses = expenses.filter(e => e.userId === currentUser?.id)

  const thisMonthTotal = myExpenses
    .filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, e) => sum + e.amount, 0)

  const filtered = myExpenses
    .filter(e => e.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
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
          This month: <span className="font-semibold text-red-400">{formatCurrency(thisMonthTotal)}</span>
        </div>
        <Button
          style={{background: 'var(--color-brand-blue)'}}
          onClick={() => { setEditing(undefined); setShowForm(true) }}
        >
          <Plus size={16} className="mr-2" /> Add
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
                const meta = CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other
                return (
                  <tr key={e.id} className="hover:bg-white/5 transition-colors" style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td className="px-4 py-3 font-medium">{e.description}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs capitalize px-2 py-0.5 rounded-full"
                        style={{background: meta.bg, color: meta.color}}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-xs uppercase" style={{color: 'var(--color-muted-foreground)'}}>{e.paymentMode}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-400">{formatCurrency(e.amount)}</td>
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
                          onClick={() => deleteExpense(e.id)}
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
