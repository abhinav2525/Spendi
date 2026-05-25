'use client'
import { useExpenseStore } from '@/lib/store/useExpenseStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { Receipt, ShoppingCart, Car, Zap, Tv, Heart, BookOpen, MoreHorizontal } from 'lucide-react'

const CATEGORY_META: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  food:          { icon: Receipt,        bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24' },
  shopping:      { icon: ShoppingCart,   bg: 'rgba(236,72,153,0.1)', color: '#f472b6' },
  transport:     { icon: Car,            bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
  utilities:     { icon: Zap,            bg: 'rgba(234,179,8,0.1)',  color: '#facc15' },
  entertainment: { icon: Tv,             bg: 'rgba(139,92,246,0.1)', color: '#a78bfa' },
  health:        { icon: Heart,          bg: 'rgba(239,68,68,0.1)',  color: '#f87171' },
  education:     { icon: BookOpen,       bg: 'rgba(34,197,94,0.1)',  color: '#4ade80' },
  other:         { icon: MoreHorizontal, bg: 'rgba(100,116,139,0.1)',color: '#94a3b8' },
}

export function RecentTransactions() {
  const { expenses } = useExpenseStore()
  const { currentUser } = useAuthStore()

  const recent = expenses
    .filter(e => e.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold" style={{color: 'var(--color-muted-foreground)'}}>Recent Transactions</h3>
      <div className="space-y-3">
        {recent.map(e => {
          const meta = CATEGORY_META[e.category] || CATEGORY_META.other
          const Icon = meta.icon
          return (
            <div key={e.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background: meta.bg}}>
                <Icon size={16} style={{color: meta.color}} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.description}</p>
                <p className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(e.date)}</p>
              </div>
              <span className="text-sm font-semibold text-red-400">-{formatCurrency(e.amount)}</span>
            </div>
          )
        })}
        {!recent.length && <p className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>No transactions yet</p>}
      </div>
    </div>
  )
}
