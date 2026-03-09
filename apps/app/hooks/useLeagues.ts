'use client'

import {
    getAvailableLeagues,
    getUserLeagues,
} from '@/lib/actions/leagues.actions'
import { getPlayerClub } from '@/lib/actions/organizations.actions'
import { getPlayerProfile } from '@/lib/actions/player.actions'
import { AppError, transformError } from '@/lib/utils/errors'
import { UserLeague } from '@/lib/validation/leagues.validation'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const fetchLeaguesData = async () => {
  const { data: playerData, error: playerError } = await getPlayerProfile()
  if (playerError || !playerData) {
    throw playerError || new Error('Player not found.')
  }

  // Fetch player's club to filter club-only leagues
  const { data: playerClub } = await getPlayerClub(playerData.id)
  const playerOrganizationId = playerClub?.organization_id || null

  const [userLeaguesResult, availableLeaguesResult] = await Promise.all([
    getUserLeagues(playerData.id),
    playerData.city_id
      ? getAvailableLeagues(playerData.city_id, playerOrganizationId)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (userLeaguesResult.error) throw new Error(userLeaguesResult.error.message)
  if (availableLeaguesResult.error) throw new Error(availableLeaguesResult.error.message)

  return {
    playerData,
    userLeagues: userLeaguesResult.data || [],
    availableLeagues: availableLeaguesResult.data || [],
  }
}

export function useLeagues() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leagues'],
    queryFn: fetchLeaguesData,
    // Cache league data since it doesn't change frequently
    staleTime: 10 * 60 * 1000, // 10 minutes - data is considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep unused data in cache
    // Refetch on mount only if data is stale (respects staleTime)
    // Changed from 'always' which was ignoring staleTime
    refetchOnMount: true,
    // Enable background refetching for fresh data
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    // Only refetch in background if user is active
    refetchIntervalInBackground: false,
  })

  const [selectedLeague, setSelectedLeague] = useState<UserLeague | null>(null)

  useEffect(() => {
    if (data?.userLeagues && data.userLeagues.length > 0) {
      const currentSelectedExists = selectedLeague
        ? data.userLeagues.some(
            (l) => l.league.id === selectedLeague.league.id
          )
        : false
      if (!currentSelectedExists) {
        setSelectedLeague(data.userLeagues[0])
      }
    } else if (!isLoading) { // only set to null if not loading
      setSelectedLeague(null)
    }
  }, [data, selectedLeague, isLoading])

  return {
    currentPlayer: data?.playerData,
    userLeagues: data?.userLeagues ?? [],
    availableLeagues: data?.availableLeagues ?? [],
    selectedLeague,
    setSelectedLeague,
    loading: isLoading,
    error: error as Error | null,
    refresh: refetch,
  }
} 