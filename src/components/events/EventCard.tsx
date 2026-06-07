'use client'
import Link from 'next/link'
import { EventSummary } from '@/lib/utils/eventStatus'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { OwnerPill } from '@/components/layout/OwnerPill'
import { Users } from 'lucide-react'

const PHASE_STYLE = {
  upcoming: { bg: '#a5d8ff33', color: '#2c6ea8', border: '#a5d8ff99', label: 'Upcoming' },
  ongoing:  { bg: '#a3e4d733', color: '#1f7a68', border: '#a3e4d799', label: 'Ongoing' },
  past:     { bg: '#d4d4d433', color: '#666',    border: '#d4d4d499', label: 'Past' },
} as const

interface Props {
  summary: EventSummary
}

export function EventCard({ summary }: Props) {
  const { event, phase, daysUntil, totalSpent, expenseCount } = summary
  const phaseStyle = PHASE_STYLE[phase]

  const dateLabel = event.endDate && event.endDate !== event.startDate
    ? `${formatDate(event.startDate)} → ${formatDate(event.endDate)}`
    : formatDate(event.startDate)

  let countdown: string | null = null
  if (phase === 'upcoming') countdown = daysUntil === 0 ? 'Starts today' : `In ${daysUntil}d`
  if (phase === 'ongoing') countdown = 'Happening now'

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="glass-card-hover p-5 space-y-4 cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{background: 'color-mix(in oklch, var(--color-accent) 60%, transparent)'}}
            >
              {event.emoji}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{event.name}</p>
              <p className="text-xs truncate" style={{color: 'var(--color-muted-foreground)'}}>
                {dateLabel}
              </p>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider shrink-0"
            style={{background: phaseStyle.bg, color: phaseStyle.color, borderColor: phaseStyle.border}}
          >
            {phaseStyle.label}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
              Spent
            </p>
            <p className="hero-number text-2xl" style={{color: 'var(--color-expense)'}}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="text-right text-xs space-y-1" style={{color: 'var(--color-muted-foreground)'}}>
            <p className="font-bold">{expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}</p>
            {countdown && <p>{countdown}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2" style={{borderTop: '1px solid var(--color-border)'}}>
          {event.scope === 'household' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
              <Users size={10} /> Household
            </span>
          ) : event.userId ? (
            <OwnerPill userId={event.userId} />
          ) : null}
        </div>
      </div>
    </Link>
  )
}
