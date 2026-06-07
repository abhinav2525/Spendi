'use client'
import { useState } from 'react'
import { useIncomesQuery, useDeleteIncome } from '@/lib/client/hooks/useIncomes'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OwnerPill } from '@/components/layout/OwnerPill'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import { IncomeForm } from './IncomeForm'
import { Income } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { SOURCE_COLOR_MAP, chartTooltipStyle } from '@/lib/charts/theme'

const SOURCE_COLORS = SOURCE_COLOR_MAP

export function IncomeList() {
  const { scope } = useScopeStore()
  const { data: incomes = [] } = useIncomesQuery(scope)
  const del = useDeleteIncome()
  const [editing, setEditing] = useState<Income | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const scoped = [...incomes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const q = search.toLowerCase().trim()
  const mine = q
    ? scoped.filter(i =>
        i.description.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q)
      )
    : scoped

  const thisMonthTotal = scoped
    .filter(i => i.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, i) => sum + i.amount, 0)

  const bySource = scoped.reduce((acc, i) => ({
    ...acc,
    [i.source]: (acc[i.source] || 0) + i.amount
  }), {} as Record<string, number>)

  const chartData = Object.entries(bySource).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color: 'var(--color-muted-foreground)'}} />
          <Input
            placeholder="Search income..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm whitespace-nowrap" style={{color: 'var(--color-muted-foreground)'}}>
          This month: <span className="font-bold" style={{color: 'var(--color-income)'}}>{formatCurrency(thisMonthTotal)}</span>
        </div>
        <Button
          className="rounded-2xl font-bold transition-transform active:scale-95"
          style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
          onClick={() => { setEditing(undefined); setShowForm(true) }}
        >
          <Plus size={16} className="mr-1.5" /> Add Income
        </Button>
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{color: 'var(--color-muted-foreground)'}}>Income by Source</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[entry.name.toLowerCase()] || SOURCE_COLORS.other} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={chartTooltipStyle()}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-120">
          <thead>
            <tr style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Description</th>
              <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Source</th>
              <th className="text-left px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Date</th>
              <th className="text-right px-4 py-3 font-medium" style={{color: 'var(--color-muted-foreground)'}}>Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {mine.map(i => (
              <tr key={i.id} className="transition-colors hover:bg-[color-mix(in_oklch,var(--color-muted)_55%,transparent)]" style={{borderBottom: '1px solid var(--color-border)'}}>
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{i.description}</span>
                    {scope === 'household' && <OwnerPill userId={i.userId} />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-[11px] font-bold capitalize px-2.5 py-1 rounded-full border"
                    style={{
                      background: `${SOURCE_COLORS[i.source] || SOURCE_COLORS.other}33`,
                      color: SOURCE_COLORS[i.source] || SOURCE_COLORS.other,
                      borderColor: `${SOURCE_COLORS[i.source] || SOURCE_COLORS.other}66`,
                    }}
                  >
                    {i.source}
                  </span>
                </td>
                <td className="px-4 py-3" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(i.date)}</td>
                <td className="px-4 py-3 text-right font-bold" style={{color: 'var(--color-income)'}}>{formatCurrency(i.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(i); setShowForm(true) }}>
                      <Pencil size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => del.mutate(i.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!mine.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center" style={{color: 'var(--color-muted-foreground)'}}>
                  {q ? 'No income matches your search' : 'No income recorded yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <IncomeForm open={showForm} onClose={() => { setShowForm(false); setEditing(undefined) }} editing={editing} />
    </div>
  )
}
