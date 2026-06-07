'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon, Bell } from 'lucide-react'
import { useUser } from '@/lib/client/hooks/useUser'
import { Button } from '@/components/ui/button'
import { ScopeToggle } from './ScopeToggle'

interface HeaderProps { title: string }

export function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { data: currentUser } = useUser()

  return (
    <header
      className="sticky top-0 z-40 px-4 md:px-6 py-3.5 flex items-center justify-between"
      style={{
        background: 'color-mix(in oklch, var(--color-background) 85%, transparent)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <h1 className="text-xl md:text-2xl" style={{fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em'}}>
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <ScopeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-2xl">
          <Bell size={18} />
        </Button>
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold"
          style={{
            background: 'color-mix(in oklch, var(--color-primary) 22%, transparent)',
            border: '1.5px solid color-mix(in oklch, var(--color-primary) 45%, transparent)',
            color: 'var(--color-primary)',
          }}
        >
          {currentUser?.name?.[0] ?? '?'}
        </div>
      </div>
    </header>
  )
}
