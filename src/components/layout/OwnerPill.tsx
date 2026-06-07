'use client'
import { useUser } from '@/lib/client/hooks/useUser'
import { useHouseholdMembers } from '@/lib/client/hooks/useHouseholdMembers'

const PALETTE = [
  { bg: '#ffb88c33', color: '#a8542e', border: '#ffb88c66' }, // peach
  { bg: '#c8b6ff33', color: '#6f4eb8', border: '#c8b6ff66' }, // lavender
  { bg: '#a3e4d733', color: '#1f7a68', border: '#a3e4d766' }, // mint
  { bg: '#ffadad33', color: '#a83e3e', border: '#ffadad66' }, // rose
  { bg: '#a5d8ff33', color: '#2c6ea8', border: '#a5d8ff66' }, // sky
]

function hashIndex(id: string, len: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % len
}

interface Props {
  userId: string
  className?: string
}

export function OwnerPill({ userId, className }: Props) {
  const { data: currentUser } = useUser()
  const { data: members } = useHouseholdMembers()
  const owner = members?.find(u => u.id === userId)
  if (!owner) return null
  const isMe = currentUser?.id === userId
  const label = isMe ? 'You' : owner.name.split(' ')[0]
  const c = PALETTE[hashIndex(userId, PALETTE.length)]
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${className ?? ''}`}
      style={{ background: c.bg, color: c.color, borderColor: c.border }}
    >
      {label}
    </span>
  )
}
