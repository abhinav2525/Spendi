'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useExpenseStore } from '@/lib/store/useExpenseStore'
import { useIncomeStore } from '@/lib/store/useIncomeStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { getLast6Months } from '@/lib/utils/dateHelpers'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { format, subMonths } from 'date-fns'

export function CashFlowChart() {
  const { expenses } = useExpenseStore()
  const { incomes } = useIncomeStore()
  const { currentUser } = useAuthStore()

  const months = getLast6Months()
  const data = months.map((label, i) => {
    const monthKey = format(subMonths(new Date(), 5 - i), 'yyyy-MM')
    const inc = incomes.filter(x => x.userId === currentUser?.id && x.date.startsWith(monthKey)).reduce((s, x) => s + x.amount, 0)
    const exp = expenses.filter(x => x.userId === currentUser?.id && x.date.startsWith(monthKey)).reduce((s, x) => s + x.amount, 0)
    return { month: label, 'Net Savings': inc - exp }
  })

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold" style={{color: 'var(--color-muted-foreground)'}}>Net Savings (6 months)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.623 0.214 259.1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.623 0.214 259.1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v)/1000}k`} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
          <Area type="monotone" dataKey="Net Savings" stroke="oklch(0.623 0.214 259.1)" fill="url(#savingsGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
