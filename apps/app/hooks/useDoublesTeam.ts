'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlayerTeamInLeague,
  getAvailablePartners,
  createDoublesTeam,
  getMyDoublesTeams,
  updateDoublesTeam,
  disbandDoublesTeam,
} from '@/lib/actions/doubles.actions'
import { DoublesTeamWithPlayers } from '@/lib/validation/doubles.validation'

// Get player's team in a specific league
export function usePlayerTeamInLeague(leagueId: string, playerId: string | null) {
  return useQuery({
    queryKey: ['player-team-in-league', leagueId, playerId],
    queryFn: async () => {
      if (!playerId) return null
      const { data, error } = await getPlayerTeamInLeague(leagueId, playerId)
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!playerId && !!leagueId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get all teams for a player
export function useMyDoublesTeams(playerId: string | null) {
  return useQuery({
    queryKey: ['my-doubles-teams', playerId],
    queryFn: async () => {
      if (!playerId) return []
      const { data, error } = await getMyDoublesTeams(playerId)
      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!playerId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Get available partners for forming a team
export function useAvailablePartners(leagueId: string, playerId: string | null) {
  return useQuery({
    queryKey: ['available-partners', leagueId, playerId],
    queryFn: async () => {
      if (!playerId) return []
      const { data, error } = await getAvailablePartners(leagueId, playerId)
      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!playerId && !!leagueId,
    staleTime: 1 * 60 * 1000, // 1 minute (changes frequently)
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Create a new doubles team
export function useCreateDoublesTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      leagueId,
      partnerId,
      teamName,
      currentPlayerId,
    }: {
      leagueId: string
      partnerId: string
      teamName?: string
      currentPlayerId: string
    }) => {
      const { data, error } = await createDoublesTeam(leagueId, currentPlayerId, partnerId, teamName)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['player-team-in-league', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['my-doubles-teams'] })
      queryClient.invalidateQueries({ queryKey: ['available-partners', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings', variables.leagueId] })
    },
  })
}

// Update a doubles team
export function useUpdateDoublesTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      teamId,
      updates,
      leagueId,
    }: {
      teamId: string
      updates: { team_name?: string }
      leagueId: string
    }) => {
      const { data, error } = await updateDoublesTeam(teamId, updates)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['player-team-in-league', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['my-doubles-teams'] })
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings', variables.leagueId] })
    },
  })
}

// Disband a doubles team
export function useDisbandDoublesTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, leagueId }: { teamId: string; leagueId: string }) => {
      const { data, error } = await disbandDoublesTeam(teamId)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['player-team-in-league', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['my-doubles-teams'] })
      queryClient.invalidateQueries({ queryKey: ['available-partners', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings', variables.leagueId] })
    },
  })
}

// Utility hook to refresh all doubles data
export function useRefreshDoublesData() {
  const queryClient = useQueryClient()

  return (leagueId: string, playerId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['available-partners', leagueId] })
    queryClient.invalidateQueries({ queryKey: ['ladder-rankings', leagueId] })
    if (playerId) {
      queryClient.invalidateQueries({ queryKey: ['player-team-in-league', leagueId, playerId] })
      queryClient.invalidateQueries({ queryKey: ['my-doubles-teams', playerId] })
    }
  }
}

// Check if a league is doubles
export function useIsDoublesLeague(participantType: string | null | undefined): boolean {
  return participantType === 'doubles'
}
