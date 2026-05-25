'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Receipt, ShoppingCart, CreditCard,
  TrendingUp, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useRouter } from 'next/navigation'

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
      { href: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    ],
  },
  {
    label: 'Income',
    items: [
      { href: '/income', icon: TrendingUp, label: 'Income' },
    ],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { logout, currentUser } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => { logout(); router.push('/login') }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 glass-card rounded-none border-r transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center justify-between p-4" style={{borderBottom: '1px solid color-mix(in oklch, white 10%, transparent)'}}>
        {!collapsed && <span className="font-bold gradient-text text-lg">GharKhata</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-4 mt-2">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--color-muted-foreground)'}}>
                {group.label}
              </p>
            )}
            {group.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium',
                  pathname === item.href
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'hover:bg-white/10'
                )}
                style={pathname !== item.href ? {color: 'var(--color-muted-foreground)'} : {}}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 space-y-2" style={{borderTop: '1px solid color-mix(in oklch, white 10%, transparent)'}}>
        {!collapsed && (
          <p className="px-2 text-xs font-medium truncate" style={{color: 'var(--color-muted-foreground)'}}>
            {currentUser?.name}
          </p>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  )
}
