'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useExpensesQuery } from '@/lib/client/hooks/useExpenses'
import { useIncomesQuery } from '@/lib/client/hooks/useIncomes'
import { useScopeStore } from '@/lib/store/useScopeStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { format } from 'date-fns'
import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react'

function useCountUp(target: number, durationMs = 900) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20%' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start: number | null = null
    let raf = 0
    const tick = (t: number) => {
      if (start === null) start = t
      const p = Math.min((t - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, durationMs])

  return { ref, value }
}

export function HeroStat() {
  const { scope } = useScopeStore()
  const { data: scopedExpenses = [] } = useExpensesQuery(scope)
  const { data: scopedIncomes = [] } = useIncomesQuery(scope)

  const monthKey = format(new Date(), 'yyyy-MM')

  const monthExpense = scopedExpenses
    .filter(e => e.date.startsWith(monthKey))
    .reduce((s, e) => s + e.amount, 0)
  const monthIncome = scopedIncomes
    .filter(i => i.date.startsWith(monthKey))
    .reduce((s, i) => s + i.amount, 0)
  const net = monthIncome - monthExpense
  const isPositive = net >= 0

  const { ref, value } = useCountUp(Math.abs(net))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative overflow-hidden p-6 md:p-8"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in oklch, var(--color-primary) 14%, var(--color-card)) 0%, color-mix(in oklch, var(--color-accent) 22%, var(--color-card)) 100%)',
        border: '1.5px solid color-mix(in oklch, var(--color-primary) 25%, transparent)',
        borderRadius: 'var(--radius-lg, 2rem)',
      }}
    >
      {/* decorative blob */}
      <motion.div
        aria-hidden
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
        style={{background: 'color-mix(in oklch, var(--color-primary) 35%, transparent)', filter: 'blur(40px)'}}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative space-y-3">
        <span className="candy-tag">
          <Sparkles size={11} />
          {scope === 'household' ? 'household' : 'mine'} · this month
        </span>

        <div className="flex items-end gap-3 flex-wrap">
          <span
            ref={ref}
            className="hero-number text-4xl xs:text-5xl sm:text-6xl md:text-7xl break-words"
            style={{color: isPositive ? 'var(--color-income)' : 'var(--color-expense)'}}
          >
            {isPositive ? '+' : '−'}{formatCurrency(value).replace('₹', '₹')}
          </span>
          <span className="text-sm font-bold pb-2" style={{color: 'var(--color-muted-foreground)'}}>
            net this month
          </span>
        </div>

        <div className="flex gap-6 pt-1 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{background: 'color-mix(in oklch, var(--color-income) 22%, transparent)', color: 'var(--color-income)'}}
            >
              <ArrowUpRight size={14} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Income</p>
              <p className="font-bold">{formatCurrency(monthIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{background: 'color-mix(in oklch, var(--color-expense) 22%, transparent)', color: 'var(--color-expense)'}}
            >
              <ArrowDownRight size={14} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>Spent</p>
              <p className="font-bold">{formatCurrency(monthExpense)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
