'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface LadderChallengePayload {
  id: string
  league_id: string
  challenger_player_id: string | null
  challenged_player_id: string | null
  status: string
}

interface LadderRankingPayload {
  id: string
  league_id: string
  player_id: string | null
  position: number
}

/**
 * Hook to subscribe to realtime updates for ladder challenges and rankings.
 * Automatically invalidates TanStack Query caches when changes are detected.
 *
 * @param leagueId - The league ID to subscribe to
 * @param playerId - The current player ID (optional, for player-specific invalidation)
 */
export function useLadderRealtimeSubscription(
  leagueId: string | null,
  playerId: string | null
) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!leagueId) return

    // Create a unique channel name for this league
    const channelName = `ladder-${leagueId}`

    // Subscribe to ladder_challenges table changes for this league
    const channel = supabase
      .channel(channelName)
      .on<LadderChallengePayload>(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ladder_challenges',
          filter: `league_id=eq.${leagueId}`,
        },
        (payload) => {
          console.log('[Realtime] ladder_challenges change:', payload.eventType, payload.new)

          const newRecord = payload.new as LadderChallengePayload | undefined
          const oldRecord = payload.old as LadderChallengePayload | undefined

          // Invalidate queries that might be affected
          queryClient.invalidateQueries({ queryKey: ['ladder-rankings', leagueId] })
          queryClient.invalidateQueries({ queryKey: ['active-challenge', leagueId] })
          queryClient.invalidateQueries({ queryKey: ['challenge-history', leagueId] })
          queryClient.invalidateQueries({ queryKey: ['can-challenge-position', leagueId] })

          // If the current player is involved, also invalidate their pending challenges
          if (playerId) {
            const involvedPlayerIds = [
              newRecord?.challenger_player_id,
              newRecord?.challenged_player_id,
              oldRecord?.challenger_player_id,
              oldRecord?.challenged_player_id,
            ].filter(Boolean)

            if (involvedPlayerIds.includes(playerId)) {
              queryClient.invalidateQueries({ queryKey: ['pending-challenges', playerId] })
              queryClient.invalidateQueries({ queryKey: ['active-challenge', leagueId, playerId] })
            }
          }

          // Always invalidate pending-challenges for all players involved
          // This ensures both challenger and challenged see updates
          const allInvolvedPlayers = [
            newRecord?.challenger_player_id,
            newRecord?.challenged_player_id,
            oldRecord?.challenger_player_id,
            oldRecord?.challenged_player_id,
          ].filter((id): id is string => id !== null && id !== undefined)

          allInvolvedPlayers.forEach((pid) => {
            queryClient.invalidateQueries({ queryKey: ['pending-challenges', pid] })
            queryClient.invalidateQueries({ queryKey: ['active-challenge', leagueId, pid] })
          })
        }
      )
      .on<LadderRankingPayload>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ladder_rankings',
          filter: `league_id=eq.${leagueId}`,
        },
        (payload) => {
          console.log('[Realtime] ladder_rankings change:', payload.eventType, payload.new)

          // Invalidate rankings query
          queryClient.invalidateQueries({ queryKey: ['ladder-rankings', leagueId] })

          // If the current player's ranking changed, invalidate their position query
          const newRecord = payload.new as LadderRankingPayload | undefined
          const oldRecord = payload.old as LadderRankingPayload | undefined

          if (playerId) {
            if (newRecord?.player_id === playerId || oldRecord?.player_id === playerId) {
              queryClient.invalidateQueries({
                queryKey: ['player-ladder-position', leagueId, playerId]
              })
            }
          }

          // Invalidate position history for affected players
          const affectedPlayers = [
            newRecord?.player_id,
            oldRecord?.player_id,
          ].filter((id): id is string => id !== null && id !== undefined)

          affectedPlayers.forEach((pid) => {
            queryClient.invalidateQueries({
              queryKey: ['position-history', leagueId, pid]
            })
          })
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
      })

    channelRef.current = channel

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('[Realtime] Unsubscribing from channel:', channelName)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [leagueId, playerId, queryClient])
}

/**
 * Hook to subscribe to realtime updates for all pending challenges for a player.
 * This is useful for global notifications across all leagues.
 *
 * @param playerId - The player ID to subscribe to
 */
export function usePlayerChallengesRealtimeSubscription(playerId: string | null) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!playerId) return

    const channelName = `player-challenges-${playerId}`

    // Subscribe to challenges where this player is the challenged party
    const channel = supabase
      .channel(channelName)
      .on<LadderChallengePayload>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ladder_challenges',
          filter: `challenged_player_id=eq.${playerId}`,
        },
        (payload) => {
          console.log('[Realtime] Incoming challenge change for player:', payload.eventType)

          // Invalidate pending challenges query
          queryClient.invalidateQueries({ queryKey: ['pending-challenges', playerId] })

          // Also invalidate league-specific queries if we can determine the league
          const record = (payload.new || payload.old) as LadderChallengePayload | undefined
          if (record?.league_id) {
            queryClient.invalidateQueries({
              queryKey: ['active-challenge', record.league_id, playerId]
            })
            queryClient.invalidateQueries({
              queryKey: ['ladder-rankings', record.league_id]
            })
          }
        }
      )
      .on<LadderChallengePayload>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ladder_challenges',
          filter: `challenger_player_id=eq.${playerId}`,
        },
        (payload) => {
          console.log('[Realtime] Outgoing challenge change for player:', payload.eventType)

          // Invalidate pending challenges query
          queryClient.invalidateQueries({ queryKey: ['pending-challenges', playerId] })

          // Also invalidate league-specific queries
          const record = (payload.new || payload.old) as LadderChallengePayload | undefined
          if (record?.league_id) {
            queryClient.invalidateQueries({
              queryKey: ['active-challenge', record.league_id, playerId]
            })
            queryClient.invalidateQueries({
              queryKey: ['can-challenge-position', record.league_id]
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Player challenges subscription status:', status)
      })

    channelRef.current = channel

    return () => {
      console.log('[Realtime] Unsubscribing from player challenges channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [playerId, queryClient])
}
