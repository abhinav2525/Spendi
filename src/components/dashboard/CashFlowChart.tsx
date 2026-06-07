'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useIncomesQuery } from '@/lib/client/hooks/useIncomes'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { getLast6Months } from '@/lib/utils/dateHelpers'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { format, subMonths } from 'date-fns'
import { NET_COLOR, chartTooltipStyle } from '@/lib/charts/theme'

export function CashFlowChart() {
  const { scope } = useScopeStore()
  const { data: scopedExpenses = [] } = useExpensesQuery(scope)
  const { data: scopedIncomes = [] } = useIncomesQuery(scope)

  const months = getLast6Months()
  const data = months.map((label, i) => {
    const monthKey = format(subMonths(new Date(), 5 - i), 'yyyy-MM')
    const inc = scopedIncomes.filter(x => x.date.startsWith(monthKey)).reduce((s, x) => s + x.amount, 0)
    const exp = scopedExpenses.filter(x => x.date.startsWith(monthKey)).reduce((s, x) => s + x.amount, 0)
    return { month: label, 'Net Savings': inc - exp }
  })

  return (
    <div className="glass-card p-5 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Net Savings (6 months)</h3>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={NET_COLOR} stopOpacity={0.45} />
              <stop offset="95%" stopColor={NET_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklch, var(--color-foreground) 8%, transparent)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v)/1000}k`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={chartTooltipStyle()} />
          <Area type="monotone" dataKey="Net Savings" stroke={NET_COLOR} fill="url(#savingsGrad)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
