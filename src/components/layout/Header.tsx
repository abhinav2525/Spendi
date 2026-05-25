'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon, Bell } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Button } from '@/components/ui/button'

interface HeaderProps { title: string }

export function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { currentUser } = useAuthStore()

  return (
    <header className="sticky top-0 z-40 glass-card rounded-none border-b px-4 md:px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-xl">
          <Bell size={18} />
        </Button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{background: 'oklch(0.623 0.214 259.1 / 0.2)', border: '1px solid oklch(0.623 0.214 259.1 / 0.3)', color: 'oklch(0.623 0.214 259.1)'}}
        >
          {currentUser?.name?.[0] ?? '?'}
        </div>
      </div>
    </header>
  )
}
