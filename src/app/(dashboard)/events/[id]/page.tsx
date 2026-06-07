'use client'
import { useState } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { useEventStore } from '@/lib/store/useEventStore'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useUser } from '@/lib/client/hooks/useUser'
import { summarizeEvent, phaseOf } from '@/lib/utils/eventStatus'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateHelpers'
import { CATEGORY_COLOR_MAP } from '@/lib/charts/theme'
import { Button } from '@/components/ui/button'
import { OwnerPill } from '@/components/layout/OwnerPill'
import { EventForm } from '@/components/events/EventForm'
import { Pencil, Trash2, ArrowLeft, Users, Calendar, Receipt } from 'lucide-react'

const PHASE_STYLE = {
  upcoming: { bg: '#a5d8ff33', color: '#2c6ea8', border: '#a5d8ff99', label: 'Upcoming' },
  ongoing:  { bg: '#a3e4d733', color: '#1f7a68', border: '#a3e4d799', label: 'Ongoing' },
  past:     { bg: '#d4d4d433', color: '#666',    border: '#d4d4d499', label: 'Past' },
} as const

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { events, deleteEvent } = useEventStore()
  const { data: expenses = [] } = useExpensesQuery('household')
  const { data: currentUser } = useUser()
  const [editing, setEditing] = useState(false)

  const event = events.find(e => e.id === params.id)
  if (!event) {
    notFound()
  }

  const summary = summarizeEvent(event, expenses)
  const phase = phaseOf(event)
  const phaseStyle = PHASE_STYLE[phase]

  const linkedExpenses = expenses
    .filter(e => e.eventId === event.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const byCategory = linkedExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  const handleDelete = () => {
    if (confirm(`Delete "${event.name}"? Linked expenses will keep their data but lose the event tag.`)) {
      deleteEvent(event.id)
      router.push('/events')
    }
  }

  const dateLabel = event.endDate && event.endDate !== event.startDate
    ? `${formatDate(event.startDate)} → ${formatDate(event.endDate)}`
    : formatDate(event.startDate)

  return (
    <>
      <Header title="Event" />
      <div className="page-container">
        <button
          onClick={() => router.push('/events')}
          className="inline-flex items-center gap-1.5 text-sm font-bold w-fit transition-colors hover:text-foreground"
          style={{color: 'var(--color-muted-foreground)'}}
        >
          <ArrowLeft size={14} /> All events
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative overflow-hidden p-6 md:p-8"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklch, var(--color-primary) 12%, var(--color-card)) 0%, color-mix(in oklch, var(--color-accent) 22%, var(--color-card)) 100%)',
            border: '1.5px solid color-mix(in oklch, var(--color-primary) 25%, transparent)',
            borderRadius: 'var(--radius-lg, 2rem)',
          }}
        >
          <motion.div
            aria-hidden
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
            style={{background: 'color-mix(in oklch, var(--color-primary) 30%, transparent)', filter: 'blur(40px)'}}
            animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.75, 0.55] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shrink-0"
                  style={{background: 'color-mix(in oklch, var(--color-accent) 70%, transparent)'}}
                >
                  {event.emoji}
                </div>
                <div className="min-w-0">
                  <h2 className="text-3xl md:text-4xl break-words" style={{fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em'}}>
                    {event.name}
                  </h2>
                  <p className="text-sm mt-1 flex items-center gap-1.5" style={{color: 'var(--color-muted-foreground)'}}>
                    <Calendar size={13} /> {dateLabel}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => setEditing(true)}>
                  <Pencil size={13} className="mr-1.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="rounded-2xl" onClick={handleDelete} style={{color: 'var(--color-destructive)'}}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider"
                style={{background: phaseStyle.bg, color: phaseStyle.color, borderColor: phaseStyle.border}}
              >
                {phaseStyle.label}
              </span>
              {event.scope === 'household' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{color: 'var(--color-muted-foreground)'}}>
                  <Users size={10} /> Household
                </span>
              ) : event.userId ? (
                <OwnerPill userId={event.userId} />
              ) : null}
            </div>

            {event.notes && (
              <p className="text-sm" style={{color: 'var(--color-muted-foreground)'}}>{event.notes}</p>
            )}

            <div className="flex flex-wrap gap-6 pt-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Total spent</p>
                <p className="hero-number text-4xl md:text-5xl mt-1" style={{color: 'var(--color-expense)'}}>
                  {formatCurrency(summary.totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Expenses</p>
                <p className="hero-number text-4xl md:text-5xl mt-1">{summary.expenseCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category breakdown */}
        {categoryEntries.length > 0 && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
              By category
            </h3>
            <div className="space-y-2">
              {categoryEntries.map(([cat, amt]) => {
                const pct = (amt / summary.totalSpent) * 100
                const color = CATEGORY_COLOR_MAP[cat] ?? CATEGORY_COLOR_MAP.other
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-bold">{cat}</span>
                      <span style={{color: 'var(--color-muted-foreground)'}}>
                        {formatCurrency(amt)} <span className="opacity-60">· {Math.round(pct)}%</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{background: `${color}33`}}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{background: color}}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.34, 1.4, 0.64, 1] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Linked expenses */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
              Linked expenses
            </h3>
            <span className="text-xs font-bold" style={{color: 'var(--color-muted-foreground)'}}>
              {linkedExpenses.length}
            </span>
          </div>

          {linkedExpenses.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{color: 'var(--color-muted-foreground)'}}>
              <Receipt size={24} className="mx-auto mb-2 opacity-50" />
              <p>No expenses tagged to this event yet.</p>
              <p className="text-xs mt-1">When adding an expense, select &quot;{event.name}&quot; in the Event field.</p>
            </div>
          ) : (
            <div className="divide-y" style={{borderColor: 'var(--color-border)'}}>
              {linkedExpenses.map(e => {
                const color = CATEGORY_COLOR_MAP[e.category] ?? CATEGORY_COLOR_MAP.other
                return (
                  <div key={e.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="text-[10px] font-bold capitalize px-2 py-1 rounded-full border shrink-0"
                        style={{background: `${color}33`, color, borderColor: `${color}66`}}
                      >
                        {e.category}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{e.description}</p>
                        <p className="text-xs flex items-center gap-2" style={{color: 'var(--color-muted-foreground)'}}>
                          {formatDate(e.date)}
                          {currentUser?.id !== e.userId && <OwnerPill userId={e.userId} />}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold shrink-0" style={{color: 'var(--color-expense)'}}>
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <EventForm open={editing} onClose={() => setEditing(false)} editing={event} />
    </>
  )
}
