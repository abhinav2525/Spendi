'use client'

import { useQuery } from '@tanstack/react-query'
import { listHouseholdMembers } from '@/lib/server/actions/household'

export function useHouseholdMembers() {
  return useQuery({
    queryKey: ['household-members'],
    queryFn: () => listHouseholdMembers(),
    staleTime: 5 * 60 * 1000,
  })
}
