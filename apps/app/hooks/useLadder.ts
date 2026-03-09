'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLadderRankings,
  getActiveChallenge,
  getPendingChallengesForPlayer,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  canChallengePosition,
  getChallengeHistory,
  getPositionHistory,
  getPlayerLadderPosition,
  editLadderMatchResult,
} from '@/lib/actions/ladder.actions'
import { reportMatchResult } from '@/lib/actions/matches.actions'
import {
  LadderRankingWithPlayer,
  LadderChallengeWithPlayers,
  ChallengeValidationResult,
} from '@/lib/validation/ladder.validation'

// Fetch ladder rankings for a league
export function useLadderRankings(leagueId: string) {
  return useQuery({
    queryKey: ['ladder-rankings', leagueId],
    queryFn: async () => {
      const { data, error } = await getLadderRankings(leagueId)
      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!leagueId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get player's position in the ladder
export function usePlayerLadderPosition(leagueId: string, playerId: string | null) {
  return useQuery({
    queryKey: ['player-ladder-position', leagueId, playerId],
    queryFn: async () => {
      if (!playerId) return null
      const { data, error } = await getPlayerLadderPosition(leagueId, playerId)
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!playerId && !!leagueId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Get user's active challenge (outgoing or incoming)
export function useActiveChallenge(leagueId: string, playerId: string | null) {
  return useQuery({
    queryKey: ['active-challenge', leagueId, playerId],
    queryFn: async () => {
      if (!playerId) return null
      const { data, error } = await getActiveChallenge(leagueId, playerId)
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!playerId && !!leagueId,
    staleTime: 30 * 1000, // 30 seconds (time-sensitive data)
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get pending challenges for a player (incoming challenges they need to respond to)
export function usePendingChallenges(playerId: string | null) {
  return useQuery({
    queryKey: ['pending-challenges', playerId],
    queryFn: async () => {
      if (!playerId) return []
      const { data, error } = await getPendingChallengesForPlayer(playerId)
      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!playerId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Check if player can challenge a specific position
export function useCanChallengePosition(
  leagueId: string,
  playerId: string | null,
  challengedPosition: number
) {
  return useQuery({
    queryKey: ['can-challenge-position', leagueId, playerId, challengedPosition],
    queryFn: async () => {
      if (!playerId) return { valid: false, reason: 'Not authenticated' }
      const { data, error } = await canChallengePosition(leagueId, playerId, challengedPosition)
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!playerId && !!leagueId && challengedPosition > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get challenge history for a league
export function useChallengeHistory(leagueId: string, playerId?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['challenge-history', leagueId, playerId, limit],
    queryFn: async () => {
      const { data, error } = await getChallengeHistory(leagueId, playerId, limit)
      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!leagueId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Get position history for a player
export function usePositionHistory(leagueId: string, playerId: string | null, limit: number = 20) {
  return useQuery({
    queryKey: ['position-history', leagueId, playerId, limit],
    queryFn: async () => {
      if (!playerId) return []
      const { data, error } = await getPositionHistory(leagueId, playerId, limit)
      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!playerId && !!leagueId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Create a new challenge
export function useCreateChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId, challengedPosition }: { leagueId: string; challengedPosition: number }) => {
      const { data, error } = await createChallenge(leagueId, challengedPosition)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['active-challenge', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })
      queryClient.invalidateQueries({ queryKey: ['can-challenge-position', variables.leagueId] })
    },
  })
}

// Accept a challenge
export function useAcceptChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ challengeId, leagueId }: { challengeId: string; leagueId: string }) => {
      const { data, error } = await acceptChallenge(challengeId)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['active-challenge', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })
    },
  })
}

// Decline a challenge
export function useDeclineChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ challengeId, leagueId }: { challengeId: string; leagueId: string }) => {
      const { data, error } = await declineChallenge(challengeId)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['active-challenge', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })
    },
  })
}

// Cancel a challenge (only by the challenger, only if pending)
export function useCancelChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ challengeId, leagueId }: { challengeId: string; leagueId: string }) => {
      const { data, error } = await cancelChallenge(challengeId)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['active-challenge', variables.leagueId] })
      queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })
      queryClient.invalidateQueries({ queryKey: ['can-challenge-position', variables.leagueId] })
    },
  })
}

// Edit a completed ladder match result (only by original submitter, only once)
export function useEditLadderMatchResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      matchId,
      challengeId,
      scores,
      winnerId,
    }: {
      matchId: string
      challengeId: string
      scores: { player1: number; player2: number }[]
      winnerId: string
    }) => {
      const { data, error } = await editLadderMatchResult(matchId, challengeId, scores, winnerId)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ladder-rankings'] })
      queryClient.invalidateQueries({ queryKey: ['active-challenge'] })
      queryClient.invalidateQueries({ queryKey: ['challenge-history'] })
      queryClient.invalidateQueries({ queryKey: ['position-history'] })
      queryClient.invalidateQueries({ queryKey: ['player-matches'] })
      queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })
    },
  })
}

// Report a match result for admin review
export function useReportMatchResult() {
  return useMutation({
    mutationFn: async ({ playerMatchId, reason }: { playerMatchId: string; reason: string }) => {
      const { data, error } = await reportMatchResult(playerMatchId, reason)
      if (error) throw new Error(error.message)
      return data
    },
  })
}

// Utility hook to refresh all ladder data for a league
export function useRefreshLadderData() {
  const queryClient = useQueryClient()

  return (leagueId: string, playerId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['ladder-rankings', leagueId] })
    queryClient.invalidateQueries({ queryKey: ['active-challenge', leagueId] })
    queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })
    queryClient.invalidateQueries({ queryKey: ['can-challenge-position', leagueId] })
    queryClient.invalidateQueries({ queryKey: ['challenge-history', leagueId] })
    if (playerId) {
      queryClient.invalidateQueries({ queryKey: ['player-ladder-position', leagueId, playerId] })
      queryClient.invalidateQueries({ queryKey: ['position-history', leagueId, playerId] })
    }
  }
}

// Check if a league uses ladder competition
export function useIsLadderLeague(competitionType: string | null | undefined): boolean {
  return competitionType === 'ladder'
}

// Re-export realtime hooks for convenience
export {
  useLadderRealtimeSubscription,
  usePlayerChallengesRealtimeSubscription,
} from './useLadderRealtime'
