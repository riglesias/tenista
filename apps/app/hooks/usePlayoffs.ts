'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlayoffTournament,
  getPlayoffTournamentWithParticipants,
  getPlayoffTournamentWithFullData,
  createPlayoffTournament,
  startPlayoffTournament,
  canUserManagePlayoffs
} from '@/lib/actions/playoffs'
import {
  PlayoffTournament,
  PlayoffTournamentWithParticipants,
  PlayoffTournamentWithFullData,
  CreatePlayoffTournament,
  StandaloneQualificationResult
} from '@/lib/validation/playoffs.validation'
import { QualificationService } from '@/lib/services/qualificationService'

export function usePlayoffTournament(leagueId: string) {
  return useQuery({
    queryKey: ['playoff-tournament', leagueId],
    queryFn: () => getPlayoffTournament(leagueId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePlayoffTournamentWithParticipants(leagueId: string) {
  return useQuery({
    queryKey: ['playoff-tournament-participants', leagueId],
    queryFn: () => getPlayoffTournamentWithParticipants(leagueId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePlayoffTournamentWithFullData(leagueId: string) {
  return useQuery({
    queryKey: ['playoff-tournament-full', leagueId],
    queryFn: () => getPlayoffTournamentWithFullData(leagueId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function usePlayoffEligibility(leagueId: string) {
  const qualificationService = new QualificationService()
  
  return useQuery({
    queryKey: ['playoff-eligibility', leagueId],
    queryFn: () => qualificationService.checkPlayoffEligibility(leagueId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useQualifyingPlayers(leagueId: string, qualifyingCount: number = 8) {
  const qualificationService = new QualificationService()
  
  return useQuery({
    queryKey: ['qualifying-players', leagueId, qualifyingCount],
    queryFn: () => qualificationService.getQualifiedPlayers({
      leagueId,
      qualifyingCount,
      // Don't filter out players with 0 matches for playoff qualification
      excludeInactivePlayers: true
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCanManagePlayoffs(leagueId: string) {
  return useQuery({
    queryKey: ['can-manage-playoffs', leagueId],
    queryFn: () => canUserManagePlayoffs(leagueId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreatePlayoffTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlayoffTournament) => createPlayoffTournament(data),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['playoff-tournament', variables.league_id]
      })
      queryClient.invalidateQueries({
        queryKey: ['playoff-tournament-participants', variables.league_id]
      })
      queryClient.invalidateQueries({
        queryKey: ['playoff-tournament-full', variables.league_id]
      })
    },
  })
}

// Hook for starting an existing playoff tournament (change status to in_progress)
export function useStartPlayoffTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tournamentId, leagueId }: { tournamentId: string; leagueId: string }) =>
      startPlayoffTournament(tournamentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['playoff-tournament', variables.leagueId]
      })
      queryClient.invalidateQueries({
        queryKey: ['playoff-tournament-full', variables.leagueId]
      })
    },
  })
}

// Hook for simulating playoff bracket
export function usePlayoffSimulation(leagueId: string, qualifyingCount: number = 8) {
  const qualificationService = new QualificationService()
  
  return useQuery({
    queryKey: ['playoff-simulation', leagueId, qualifyingCount],
    queryFn: () => qualificationService.simulatePlayoffBracket(leagueId, qualifyingCount),
    enabled: !!leagueId && qualifyingCount > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Utility hook to determine if a league has playoffs
export function useLeagueHasPlayoffs(league: any): boolean {
  return Boolean(league?.has_playoffs)
}

// Utility hook to determine if playoffs can be started
export function useCanStartPlayoffs(leagueId: string) {
  const { data: eligibility } = usePlayoffEligibility(leagueId)
  const { data: tournament } = usePlayoffTournament(leagueId)
  
  return {
    canStart: eligibility?.eligible && !tournament,
    reason: eligibility?.reason || (tournament ? 'Tournament already exists' : ''),
    playerCount: eligibility?.playerCount || 0,
    minRequired: eligibility?.minRequired || 2
  }
}

// Hook for refreshing all playoff data
export function useRefreshPlayoffData() {
  const queryClient = useQueryClient()

  return (leagueId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['playoff-tournament', leagueId]
    })
    queryClient.invalidateQueries({
      queryKey: ['playoff-tournament-participants', leagueId]
    })
    queryClient.invalidateQueries({
      queryKey: ['playoff-tournament-full', leagueId]
    })
    queryClient.invalidateQueries({
      queryKey: ['playoff-eligibility', leagueId]
    })
    queryClient.invalidateQueries({
      queryKey: ['qualifying-players', leagueId]
    })
    queryClient.invalidateQueries({
      queryKey: ['playoff-simulation', leagueId]
    })
  }
}

// Hook for standalone tournament qualifying players (seeded by W-L record from last 12 months)
export function useStandaloneQualifyingPlayers(
  participantIds: string[],
  options?: { enabled?: boolean }
) {
  const qualificationService = new QualificationService()
  const { enabled = true } = options || {}

  return useQuery({
    queryKey: ['standalone-qualifying-players', participantIds],
    queryFn: () => qualificationService.getQualifiedPlayersForStandaloneTournament(
      participantIds
    ),
    enabled: enabled && participantIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}