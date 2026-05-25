'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) router.push('/login')
  }, [currentUser, router])

  if (!currentUser) return null

  return (
    <div className="flex h-screen overflow-hidden" style={{background: 'var(--color-background)'}}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
