'use client'
import { useSubscriptionsQuery } from '@/lib/client/hooks/useSubscriptions'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { daysUntil, formatDate } from '@/lib/utils/dateHelpers'
import { formatCurrency } from '@/lib/utils/formatCurrency'

export function UpcomingDuesWidget() {
  const { scope } = useScopeStore()
  const { data: subscriptions = [] } = useSubscriptionsQuery(scope)

  const upcoming = subscriptions
    .filter(s => s.isActive)
    .map(s => ({ ...s, days: daysUntil(s.renewalDate) }))
    .filter(s => s.days >= 0 && s.days <= 30)
    .sort((a, b) => a.days - b.days)

  return (
    <div className="glass-card p-5 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Upcoming Dues</h3>
      {!upcoming.length && (
        <p className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>No dues in the next 30 days</p>
      )}
      <div className="space-y-2.5">
        {upcoming.map(s => (
          <div key={s.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">{s.name}</p>
              <p className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(s.renewalDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{formatCurrency(s.amount)}</span>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
                style={
                  s.days <= 3
                    ? {background: '#ffadad33', color: '#a83e3e', borderColor: '#ffadad99'}
                    : s.days <= 7
                    ? {background: '#ffd97d33', color: '#9c6f1e', borderColor: '#ffd97d99'}
                    : {background: '#a3e4d733', color: '#1f7a68', borderColor: '#a3e4d799'}
                }
              >
                {s.days === 0 ? 'Today' : `${s.days}d`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
