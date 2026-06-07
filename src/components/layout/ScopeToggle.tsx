'use client'
import { useScopeStore, Scope } from '@/lib/store/useScopeStore'
import { User, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const OPTIONS: { value: Scope; label: string; icon: typeof User }[] = [
  { value: 'mine', label: 'Mine', icon: User },
  { value: 'household', label: 'Household', icon: Users },
]

export function ScopeToggle() {
  const { scope, setScope } = useScopeStore()

  return (
    <div
      className="relative flex items-center rounded-full p-1 text-xs font-bold"
      style={{
        background: 'color-mix(in oklch, var(--color-muted) 60%, transparent)',
        border: '1.5px solid var(--color-border)',
      }}
    >
      {OPTIONS.map(opt => {
        const Icon = opt.icon
        const active = scope === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => setScope(opt.value)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors z-10"
            style={{
              color: active ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
            }}
          >
            {active && (
              <motion.span
                layoutId="scope-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--color-primary)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={13} className="relative z-10" />
            <span className="relative z-10 hidden sm:inline tracking-wide">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
