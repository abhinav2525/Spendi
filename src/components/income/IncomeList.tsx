'use client'
import { useState } from 'react'
import { useIncomeStore } from '@/lib/store/useIncomeStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { IncomeForm } from './IncomeForm'
import { Income } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

const SOURCE_COLORS: Record<string, string> = {
  salary: 'oklch(0.623 0.214 259.1)',
  business: 'oklch(0.696 0.17 162)',
  freelance: 'oklch(0.627 0.194 303)',
  bonus: 'oklch(0.75 0.168 79)',
  other: 'oklch(0.556 0 0)',
}

export function IncomeList() {
  const { incomes, deleteIncome } = useIncomeStore()
  const { currentUser } = useAuthStore()
  const [editing, setEditing] = useState<Income | undefined>()
  const [showForm, setShowForm] = useState(false)

  const mine = incomes
    .filter(i => i.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const thisMonthTotal = mine
    .filter(i => i.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, i) => sum + i.amount, 0)

  const bySource = mine.reduce((acc, i) => ({
    ...acc,
    [i.source]: (acc[i.source] || 0) + i.amount
  }), {} as Record<string, number>)

  const chartData = Object.entries(bySource).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>
          This month: <span className="font-semibold text-green-400">{formatCurrency(thisMonthTotal)}</span>
        </div>
        <Button
          style={{background: 'var(--color-brand-blue)'}}
          onClick={() => { setEditing(undefined); setShowForm(true) }}
        >
          <Plus size={16} className="mr-2" /> Add Income
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
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
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
              <tr key={i.id} className="hover:bg-white/5 transition-colors" style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <td className="px-4 py-3 font-medium">{i.description}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs capitalize px-2 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in oklch, ${SOURCE_COLORS[i.source] || SOURCE_COLORS.other} 20%, transparent)`,
                      color: SOURCE_COLORS[i.source] || SOURCE_COLORS.other,
                    }}
                  >
                    {i.source}
                  </span>
                </td>
                <td className="px-4 py-3" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(i.date)}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-400">{formatCurrency(i.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(i); setShowForm(true) }}>
                      <Pencil size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteIncome(i.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!mine.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center" style={{color: 'var(--color-muted-foreground)'}}>
                  No income recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <IncomeForm open={showForm} onClose={() => setShowForm(false)} editing={editing} />
    </div>
  )
}
