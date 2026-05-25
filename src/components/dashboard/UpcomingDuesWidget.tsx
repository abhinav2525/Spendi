'use client'
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { daysUntil, formatDate } from '@/lib/utils/dateHelpers'
import { formatCurrency } from '@/lib/utils/formatCurrency'

export function UpcomingDuesWidget() {
  const { subscriptions } = useSubscriptionStore()
  const { currentUser } = useAuthStore()

  const upcoming = subscriptions
    .filter(s => s.userId === currentUser?.id && s.isActive)
    .map(s => ({ ...s, days: daysUntil(s.renewalDate) }))
    .filter(s => s.days >= 0 && s.days <= 30)
    .sort((a, b) => a.days - b.days)

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold" style={{color: 'var(--color-muted-foreground)'}}>Upcoming Dues</h3>
      {!upcoming.length && (
        <p className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>No dues in the next 30 days</p>
      )}
      <div className="space-y-2">
        {upcoming.map(s => (
          <div key={s.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>{formatDate(s.renewalDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{formatCurrency(s.amount)}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={
                  s.days <= 3
                    ? {background: 'rgba(239,68,68,0.2)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)'}
                    : s.days <= 7
                    ? {background: 'rgba(245,158,11,0.2)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)'}
                    : {background: 'rgba(34,197,94,0.2)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)'}
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
