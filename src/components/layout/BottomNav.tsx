'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, TrendingUp, MoreHorizontal, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/expenses', icon: Receipt, label: 'Expenses' },
  { href: '/groceries', icon: ShoppingCart, label: 'Grocery' },
  { href: '/income', icon: TrendingUp, label: 'Income' },
  { href: '/subscriptions', icon: MoreHorizontal, label: 'More' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card rounded-none border-t z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all text-xs',
              pathname === tab.href ? 'text-blue-400' : ''
            )}
            style={pathname !== tab.href ? {color: 'var(--color-muted-foreground)'} : {}}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
