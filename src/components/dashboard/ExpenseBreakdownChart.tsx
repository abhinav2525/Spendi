'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { format } from 'date-fns'
import { CHART_COLORS, chartTooltipStyle } from '@/lib/charts/theme'

const COLORS = CHART_COLORS
const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food', transport: 'Transport', utilities: 'Utilities',
  entertainment: 'Entertainment', shopping: 'Shopping',
  health: 'Health', education: 'Education', other: 'Other'
}

export function ExpenseBreakdownChart() {
  const { scope } = useScopeStore()
  const { data: expenses = [] } = useExpensesQuery(scope)
  const thisMonth = format(new Date(), 'yyyy-MM')

  const byCategory = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }), {} as Record<string, number>)

  const data = Object.entries(byCategory).map(([cat, value]) => ({ name: CATEGORY_LABELS[cat] || cat, value }))

  if (!data.length) return (
    <div className="glass-card p-5 flex items-center justify-center h-40 text-sm" style={{color: 'var(--color-muted-foreground)'}}>
      No expenses this month
    </div>
  )

  return (
    <div className="glass-card p-5 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>This Month&apos;s Breakdown</h3>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" cornerRadius={6}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--color-card)" strokeWidth={2} />)}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={chartTooltipStyle()} />
          <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
