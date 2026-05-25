import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy')
}

export function formatMonthYear(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM yyyy')
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
  }
}

export function getLast6Months(): string[] {
  return Array.from({ length: 6 }, (_, i) =>
    format(subMonths(new Date(), 5 - i), 'MMM yy')
  )
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
