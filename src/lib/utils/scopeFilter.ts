import { Scope } from '@/lib/store/useScopeStore'

export function filterByScope<T extends { userId: string }>(
  items: T[],
  scope: Scope,
  currentUserId: string | undefined,
): T[] {
  if (scope === 'household') return items
  if (!currentUserId) return []
  return items.filter(i => i.userId === currentUserId)
}
