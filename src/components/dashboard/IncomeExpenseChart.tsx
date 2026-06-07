'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useIncomesQuery } from '@/lib/client/hooks/useIncomes'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { getLast6Months } from '@/lib/utils/dateHelpers'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { format, subMonths } from 'date-fns'
import { INCOME_COLOR, EXPENSE_COLOR, chartTooltipStyle } from '@/lib/charts/theme'

export function IncomeExpenseChart() {
  const { scope } = useScopeStore()
  const { data: scopedExpenses = [] } = useExpensesQuery(scope)
  const { data: scopedIncomes = [] } = useIncomesQuery(scope)

  const months = getLast6Months()
  const data = months.map((label, i) => {
    const monthKey = format(subMonths(new Date(), 5 - i), 'yyyy-MM')
    const totalExpense = scopedExpenses
      .filter(e => e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = scopedIncomes
      .filter(inc => inc.date.startsWith(monthKey))
      .reduce((sum, inc) => sum + inc.amount, 0)
    return { month: label, Income: totalIncome, Expenses: totalExpense }
  })

  return (
    <div className="glass-card p-5 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklch, var(--color-foreground) 8%, transparent)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v)/1000}k`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={chartTooltipStyle()} cursor={{ fill: 'color-mix(in oklch, var(--color-muted) 50%, transparent)' }} />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
          <Bar dataKey="Income" fill={INCOME_COLOR} radius={[8,8,0,0]} />
          <Bar dataKey="Expenses" fill={EXPENSE_COLOR} radius={[8,8,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
