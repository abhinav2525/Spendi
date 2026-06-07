'use client'
import { useState } from 'react'
import { useSubscriptionsQuery, useDeleteSubscription } from '@/lib/client/hooks/useSubscriptions'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { daysUntil, formatDate } from '@/lib/utils/dateHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OwnerPill } from '@/components/layout/OwnerPill'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import { SubscriptionForm } from './SubscriptionForm'
import { Subscription } from '@/types'

function getRenewalBadge(days: number) {
  if (days < 0) return { label: 'Expired', bg: '#d4d4d433', color: '#666', border: '#d4d4d4aa' }
  if (days <= 3) return { label: `${days}d left`, bg: '#ffadad33', color: '#a83e3e', border: '#ffadad99' }
  if (days <= 7) return { label: `${days}d left`, bg: '#ffd97d33', color: '#9c6f1e', border: '#ffd97d99' }
  return { label: `${days}d left`, bg: '#a3e4d733', color: '#1f7a68', border: '#a3e4d799' }
}

export function SubscriptionGrid() {
  const { scope } = useScopeStore()
  const { data: subscriptions = [] } = useSubscriptionsQuery(scope)
  const del = useDeleteSubscription()
  const [editing, setEditing] = useState<Subscription | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const scoped = subscriptions.filter(s => s.isActive)

  const q = search.toLowerCase().trim()
  const mine = q
    ? scoped.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      )
    : scoped

  const monthlyTotal = scoped.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + s.amount
    if (s.frequency === 'quarterly') return sum + s.amount / 3
    if (s.frequency === 'annual') return sum + s.amount / 12
    return sum
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color: 'var(--color-muted-foreground)'}} />
          <Input
            placeholder="Search subscriptions..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm whitespace-nowrap" style={{color: 'var(--color-muted-foreground)'}}>
          Monthly cost: <span className="font-bold" style={{color: 'var(--color-foreground)'}}>{formatCurrency(Math.round(monthlyTotal))}</span>
        </div>
        <Button
          className="rounded-2xl font-bold transition-transform active:scale-95"
          style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
          onClick={() => { setEditing(undefined); setShowForm(true) }}
        >
          <Plus size={16} className="mr-1.5" /> Add
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{s.name}</p>
                    {scope === 'household' && <OwnerPill userId={s.userId} />}
                  </div>
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
                    onClick={() => del.mutate(s.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <span className="hero-number text-3xl">{formatCurrency(s.amount)}</span>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
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
            {q ? 'No subscriptions match your search' : 'No active subscriptions'}
          </div>
        )}
      </div>

      <SubscriptionForm open={showForm} onClose={() => { setShowForm(false); setEditing(undefined) }} editing={editing} />
    </div>
  )
}
