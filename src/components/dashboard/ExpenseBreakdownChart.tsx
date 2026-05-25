'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useExpenseStore } from '@/lib/store/useExpenseStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { format } from 'date-fns'

const COLORS = ['oklch(0.623 0.214 259.1)','oklch(0.75 0.168 79)','oklch(0.696 0.17 162)','oklch(0.627 0.194 303)','oklch(0.637 0.237 25)','oklch(0.64 0.222 342)','oklch(0.699 0.187 219)','oklch(0.768 0.204 110)']
const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food', transport: 'Transport', utilities: 'Utilities',
  entertainment: 'Entertainment', shopping: 'Shopping',
  health: 'Health', education: 'Education', other: 'Other'
}

export function ExpenseBreakdownChart() {
  const { expenses } = useExpenseStore()
  const { currentUser } = useAuthStore()
  const thisMonth = format(new Date(), 'yyyy-MM')

  const byCategory = expenses
    .filter(e => e.userId === currentUser?.id && e.date.startsWith(thisMonth))
    .reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }), {} as Record<string, number>)

  const data = Object.entries(byCategory).map(([cat, value]) => ({ name: CATEGORY_LABELS[cat] || cat, value }))

  if (!data.length) return (
    <div className="glass-card p-4 flex items-center justify-center h-40 text-sm" style={{color: 'var(--color-muted-foreground)'}}>
      No expenses this month
    </div>
  )

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold" style={{color: 'var(--color-muted-foreground)'}}>This Month&apos;s Breakdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
