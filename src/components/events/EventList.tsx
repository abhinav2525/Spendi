'use client'
import { useState, useMemo } from 'react'
import { useEventStore } from '@/lib/store/useEventStore'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useUser } from '@/lib/client/hooks/useUser'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { summarizeEvent, EventPhase } from '@/lib/utils/eventStatus'
import { EventCard } from './EventCard'
import { EventForm } from './EventForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Sparkles } from 'lucide-react'

const PHASE_TABS: { value: EventPhase | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'past', label: 'Past' },
]

export function EventList() {
  const { events } = useEventStore()
  const { data: expenses = [] } = useExpensesQuery('household')
  const { data: currentUser } = useUser()
  const { scope } = useScopeStore()
  const [phaseFilter, setPhaseFilter] = useState<EventPhase | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const summaries = useMemo(() => {
    const inScope = events.filter(ev => {
      if (scope === 'mine') {
        return ev.scope === 'user' && ev.userId === currentUser?.id
      }
      return ev.scope === 'household' || ev.userId === currentUser?.id
    })

    const q = search.toLowerCase().trim()
    const matches = q
      ? inScope.filter(ev =>
          ev.name.toLowerCase().includes(q) ||
          (ev.notes?.toLowerCase().includes(q) ?? false)
        )
      : inScope

    const summarized = matches.map(ev => summarizeEvent(ev, expenses))

    const filtered = phaseFilter === 'all'
      ? summarized
      : summarized.filter(s => s.phase === phaseFilter)

    const phasePriority: Record<EventPhase, number> = { ongoing: 0, upcoming: 1, past: 2 }
    return filtered.sort((a, b) => {
      if (a.phase !== b.phase) return phasePriority[a.phase] - phasePriority[b.phase]
      return new Date(b.event.startDate).getTime() - new Date(a.event.startDate).getTime()
    })
  }, [events, expenses, currentUser?.id, scope, phaseFilter, search])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color: 'var(--color-muted-foreground)'}} />
          <Input
            placeholder="Search events…"
            className="pl-9 rounded-2xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button
          className="rounded-2xl font-bold transition-transform active:scale-95"
          style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} className="mr-1.5" /> New Event
        </Button>
      </div>

      <div
        className="inline-flex items-center rounded-full p-1 text-xs font-bold"
        style={{
          background: 'color-mix(in oklch, var(--color-muted) 60%, transparent)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        {PHASE_TABS.map(tab => {
          const active = phaseFilter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setPhaseFilter(tab.value)}
              className="px-3 py-1.5 rounded-full transition-colors"
              style={active ? {
                background: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
              } : {
                color: 'var(--color-muted-foreground)',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {summaries.length === 0 ? (
        <div className="glass-card p-10 text-center space-y-3">
          <div className="text-4xl">{search ? '🔍' : '🎈'}</div>
          <p className="font-bold">
            {search ? 'No events match your search' : phaseFilter === 'all' ? 'No events yet' : `No ${phaseFilter} events`}
          </p>
          {!search && (
            <Button
              size="sm"
              className="rounded-2xl font-bold"
              style={{background: 'var(--color-primary)', color: 'var(--color-primary-foreground)'}}
              onClick={() => setShowForm(true)}
            >
              <Sparkles size={14} className="mr-1.5" /> Create your first event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaries.map(s => (
            <EventCard key={s.event.id} summary={s} />
          ))}
        </div>
      )}

      <EventForm open={showForm} onClose={() => setShowForm(false)} scope={scope === 'household' ? 'household' : 'user'} />
    </div>
  )
}
