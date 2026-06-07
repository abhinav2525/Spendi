'use client'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { OwnerPill } from '@/components/layout/OwnerPill'
import { Receipt, ShoppingCart, Car, Zap, Tv, Heart, BookOpen, MoreHorizontal } from 'lucide-react'

const CATEGORY_META: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  food:          { icon: Receipt,        bg: '#ffb88c33', color: '#a8542e' },
  shopping:      { icon: ShoppingCart,   bg: '#ffadad33', color: '#a83e3e' },
  transport:     { icon: Car,            bg: '#a5d8ff33', color: '#2c6ea8' },
  utilities:     { icon: Zap,            bg: '#ffd97d33', color: '#9c6f1e' },
  entertainment: { icon: Tv,             bg: '#c8b6ff33', color: '#6f4eb8' },
  health:        { icon: Heart,          bg: '#a3e4d733', color: '#1f7a68' },
  education:     { icon: BookOpen,       bg: '#fdffb633', color: '#7a7820' },
  other:         { icon: MoreHorizontal, bg: '#d4d4d433', color: '#666' },
}

export function RecentTransactions() {
  const { scope } = useScopeStore()
  const { data: expenses = [] } = useExpensesQuery(scope)

  const recent = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="glass-card p-5 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Recent Transactions</h3>
      <div className="space-y-3">
        {recent.map(e => {
          const meta = CATEGORY_META[e.category] || CATEGORY_META.other
          const Icon = meta.icon
          return (
            <div key={e.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{background: meta.bg}}>
                <Icon size={16} style={{color: meta.color}} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate">{e.description}</p>
                  {scope === 'household' && <OwnerPill userId={e.userId} />}
                </div>
                <p className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(e.date)}</p>
              </div>
              <span className="text-sm font-bold" style={{color: 'var(--color-expense)'}}>−{formatCurrency(e.amount)}</span>
            </div>
          )
        })}
        {!recent.length && <p className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>No transactions yet</p>}
      </div>
    </div>
  )
}
