'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, TrendingUp, ShoppingCart, Target, CalendarHeart } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/expenses', icon: Receipt, label: 'Expenses' },
  { href: '/events', icon: CalendarHeart, label: 'Events' },
  { href: '/budgets', icon: Target, label: 'Budgets' },
  { href: '/groceries', icon: ShoppingCart, label: 'Grocery' },
  { href: '/income', icon: TrendingUp, label: 'Income' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="md:hidden fixed bottom-3 left-3 right-3 rounded-3xl z-50"
      style={{
        background: 'color-mix(in oklch, var(--color-card) 92%, transparent)',
        backdropFilter: 'blur(14px)',
        border: '1.5px solid var(--color-border)',
        boxShadow: '0 12px 30px -12px rgba(0,0,0,0.18)',
      }}
    >
      <div className="flex items-stretch justify-around px-1.5 py-2">
        {TABS.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-2xl text-[10px] font-bold flex-1"
              style={{color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)'}}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-active"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'color-mix(in oklch, var(--color-primary) 16%, transparent)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon size={18} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
