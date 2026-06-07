'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Receipt, ShoppingCart, CreditCard,
  TrendingUp, ChevronLeft, ChevronRight, LogOut, Target, CalendarHeart
} from 'lucide-react'
import { useUser } from '@/lib/client/hooks/useUser'
import { signOut } from '@/lib/server/actions/auth'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Expenses',
    items: [
      { href: '/expenses', icon: Receipt, label: 'Day-to-Day' },
      { href: '/groceries', icon: ShoppingCart, label: 'Groceries' },
      { href: '/events', icon: CalendarHeart, label: 'Events' },
      { href: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { href: '/budgets', icon: Target, label: 'Budgets' },
    ],
  },
  {
    label: 'Income',
    items: [{ href: '/income', icon: TrendingUp, label: 'Income' }],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: currentUser } = useUser()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{
        background: 'color-mix(in oklch, var(--color-background) 70%, transparent)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div
        className="flex items-center justify-between p-5"
        style={{borderBottom: '1px solid var(--color-border)'}}
      >
        {!collapsed && (
          <span className="text-2xl gradient-text">GharKhata</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl transition-colors ml-auto"
          style={{color: 'var(--color-muted-foreground)'}}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5 mt-1">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{color: 'var(--color-muted-foreground)'}}
              >
                {group.label}
              </p>
            )}
            {group.items.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200',
                    'hover:translate-x-0.5'
                  )}
                  style={active ? {
                    background: 'color-mix(in oklch, var(--color-primary) 18%, transparent)',
                    color: 'var(--color-primary)',
                    border: '1.5px solid color-mix(in oklch, var(--color-primary) 35%, transparent)',
                  } : {
                    color: 'var(--color-muted-foreground)',
                    border: '1.5px solid transparent',
                  }}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 space-y-2" style={{borderTop: '1px solid var(--color-border)'}}>
        {!collapsed && (
          <p className="px-2 text-xs font-bold truncate" style={{color: 'var(--color-muted-foreground)'}}>
            Hi, {currentUser?.name?.split(' ')[0]}
          </p>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-colors w-full',
              collapsed && 'justify-center'
            )}
            style={{color: 'var(--color-destructive)'}}
          >
            <LogOut size={16} />
            {!collapsed && 'Logout'}
          </button>
        </form>
      </div>
    </aside>
  )
}
