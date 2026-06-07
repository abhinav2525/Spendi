import { FinanceEvent, Expense } from '@/types'
import { differenceInCalendarDays, parseISO } from 'date-fns'

export type EventPhase = 'upcoming' | 'ongoing' | 'past'

export interface EventSummary {
  event: FinanceEvent
  phase: EventPhase
  daysUntil: number   // negative if past, 0 if today, positive if upcoming
  totalSpent: number
  expenseCount: number
}

export function phaseOf(event: FinanceEvent, today = new Date()): EventPhase {
  const start = parseISO(event.startDate)
  const end = event.endDate ? parseISO(event.endDate) : start
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (t < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return 'upcoming'
  if (t > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return 'past'
  return 'ongoing'
}

export function summarizeEvent(event: FinanceEvent, allExpenses: Expense[]): EventSummary {
  const linked = allExpenses.filter(e => e.eventId === event.id)
  return {
    event,
    phase: phaseOf(event),
    daysUntil: differenceInCalendarDays(parseISO(event.startDate), new Date()),
    totalSpent: linked.reduce((sum, e) => sum + e.amount, 0),
    expenseCount: linked.length,
  }
}
