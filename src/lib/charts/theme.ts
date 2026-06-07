// Shared chart palette so every Recharts surface uses the same pastel rhythm.
export const CHART_COLORS = [
  '#ffb88c', // peach
  '#a5d8ff', // sky
  '#ffd97d', // butter
  '#c8b6ff', // lavender
  '#a3e4d7', // mint
  '#ffadad', // rose
  '#fdffb6', // lemon
  '#b8c0ff', // periwinkle
]

export const INCOME_COLOR = 'oklch(0.74 0.14 155)'
export const EXPENSE_COLOR = 'oklch(0.70 0.17 25)'
export const NET_COLOR = 'oklch(0.72 0.16 165)'

export const SOURCE_COLOR_MAP: Record<string, string> = {
  salary: '#a3e4d7',
  business: '#ffd97d',
  freelance: '#c8b6ff',
  bonus: '#ffadad',
  other: '#d4d4d4',
}

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  food: '#ffb88c',
  transport: '#a5d8ff',
  utilities: '#ffd97d',
  entertainment: '#c8b6ff',
  shopping: '#ffadad',
  health: '#a3e4d7',
  education: '#fdffb6',
  other: '#d4d4d4',
}

export function chartTooltipStyle() {
  return {
    background: 'var(--color-popover)',
    color: 'var(--color-popover-foreground)',
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)',
  }
}
