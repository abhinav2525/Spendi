'use client'
import { useState } from 'react'
import { useSubscriptionStore } from '@/lib/store/useSubscriptionStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { daysUntil, formatDate } from '@/lib/utils/dateHelpers'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { SubscriptionForm } from './SubscriptionForm'
import { Subscription } from '@/types'

function getRenewalBadge(days: number) {
  if (days < 0) return { label: 'Expired', bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
  if (days <= 3) return { label: `${days}d left`, bg: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'rgba(239,68,68,0.3)' }
  if (days <= 7) return { label: `${days}d left`, bg: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
  return { label: `${days}d left`, bg: 'rgba(34,197,94,0.2)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' }
}

export function SubscriptionGrid() {
  const { subscriptions, deleteSubscription } = useSubscriptionStore()
  const { currentUser } = useAuthStore()
  const [editing, setEditing] = useState<Subscription | undefined>()
  const [showForm, setShowForm] = useState(false)

  const mine = subscriptions.filter(s => s.userId === currentUser?.id && s.isActive)

  const monthlyTotal = mine.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + s.amount
    if (s.frequency === 'quarterly') return sum + s.amount / 3
    if (s.frequency === 'annual') return sum + s.amount / 12
    return sum
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>
          Monthly cost: <span className="font-semibold" style={{color: 'var(--color-foreground)'}}>{formatCurrency(Math.round(monthlyTotal))}</span>
        </div>
        <Button
          style={{background: 'var(--color-brand-blue)'}}
          onClick={() => { setEditing(undefined); setShowForm(true) }}
        >
          <Plus size={16} className="mr-2" /> Add
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mine.map(s => {
          const days = daysUntil(s.renewalDate)
          const badge = getRenewalBadge(days)
          return (
            <div key={s.id} className="glass-card-hover p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs capitalize" style={{color: 'var(--color-muted-foreground)'}}>
                    {s.category} · {s.frequency}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setEditing(s); setShowForm(true) }}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400"
                    onClick={() => deleteSubscription(s.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <span className="text-xl font-bold">{formatCurrency(s.amount)}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{background: badge.bg, color: badge.color, borderColor: badge.border}}
                >
                  {badge.label}
                </span>
              </div>

              <p className="text-xs" style={{color: 'var(--color-muted-foreground)'}}>
                Renews {formatDate(s.renewalDate)}
              </p>
            </div>
          )
        })}
        {!mine.length && (
          <div className="col-span-full glass-card p-8 text-center" style={{color: 'var(--color-muted-foreground)'}}>
            No active subscriptions
          </div>
        )}
      </div>

      <SubscriptionForm open={showForm} onClose={() => setShowForm(false)} editing={editing} />
    </div>
  )
}
