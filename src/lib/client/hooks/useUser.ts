'use client'

import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/lib/server/actions/household'

export function useUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),
    staleTime: Infinity,
    retry: false,
  })
}
