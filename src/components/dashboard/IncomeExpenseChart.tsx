'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useExpenseStore } from '@/lib/store/useExpenseStore'
import { useIncomeStore } from '@/lib/store/useIncomeStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { getLast6Months } from '@/lib/utils/dateHelpers'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { format, subMonths } from 'date-fns'

export function IncomeExpenseChart() {
  const { expenses } = useExpenseStore()
  const { incomes } = useIncomeStore()
  const { currentUser } = useAuthStore()

  const months = getLast6Months()
  const data = months.map((label, i) => {
    const monthKey = format(subMonths(new Date(), 5 - i), 'yyyy-MM')
    const totalExpense = expenses
      .filter(e => e.userId === currentUser?.id && e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = incomes
      .filter(inc => inc.userId === currentUser?.id && inc.date.startsWith(monthKey))
      .reduce((sum, inc) => sum + inc.amount, 0)
    return { month: label, Income: totalIncome, Expenses: totalExpense }
  })

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold" style={{color: 'var(--color-muted-foreground)'}}>Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v)/1000}k`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Income" fill="oklch(0.623 0.214 259.1)" radius={[4,4,0,0]} />
          <Bar dataKey="Expenses" fill="oklch(0.75 0.168 79)" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
