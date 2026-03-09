import { useMutation, useQueryClient } from '@tanstack/react-query'
import { joinLeague, leaveLeague } from '@/lib/actions/leagues.actions'
import { UserLeague, LeagueWithStats } from '@/lib/validation/leagues.validation'
import { reportError } from '@/lib/utils/errors'

export function useJoinLeagueMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId, playerId }: { leagueId: string; playerId: string }) => {
      const result = await joinLeague(leagueId, playerId)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to join league')
      }
      return result.data
    },
    onMutate: async ({ leagueId, playerId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leagues'] })

      // Snapshot the previous value
      const previousLeagues = queryClient.getQueryData(['leagues'])

      // Optimistically update the cache
      queryClient.setQueryData(['leagues'], (old: any) => {
        if (!old) return old

        // Update available leagues to show user as member
        const updatedAvailableLeagues = old.availableLeagues?.map((league: LeagueWithStats) => 
          league.id === leagueId 
            ? { 
                ...league, 
                user_is_member: true,
                player_count: league.player_count + 1 
              }
            : league
        )

        return {
          ...old,
          availableLeagues: updatedAvailableLeagues,
        }
      })

      // Return context object with the snapshot value
      return { previousLeagues }
    },
    onError: (err, variables, context) => {
      // Roll back the optimistic update
      if (context?.previousLeagues) {
        queryClient.setQueryData(['leagues'], context.previousLeagues)
      }
      
      // Log the error
      reportError(err, 'joinLeague')
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
    },
  })
}

export function useLeaveLeagueMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leagueId, playerId }: { leagueId: string; playerId: string }) => {
      const result = await leaveLeague(leagueId, playerId)
      if (result.error) {
        throw new Error(result.error.message || 'Failed to leave league')
      }
      return result.data
    },
    onMutate: async ({ leagueId, playerId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leagues'] })

      // Snapshot the previous value
      const previousLeagues = queryClient.getQueryData(['leagues'])

      // Optimistically update the cache
      queryClient.setQueryData(['leagues'], (old: any) => {
        if (!old) return old

        // Remove the league from user leagues
        const updatedUserLeagues = old.userLeagues?.filter((league: UserLeague) => 
          league.league.id !== leagueId
        )

        // Update available leagues to show user as non-member
        const updatedAvailableLeagues = old.availableLeagues?.map((league: LeagueWithStats) => 
          league.id === leagueId 
            ? { 
                ...league, 
                user_is_member: false,
                player_count: Math.max(0, league.player_count - 1) 
              }
            : league
        )

        return {
          ...old,
          userLeagues: updatedUserLeagues,
          availableLeagues: updatedAvailableLeagues,
        }
      })

      // Return context object with the snapshot value
      return { previousLeagues }
    },
    onError: (err, variables, context) => {
      // Roll back the optimistic update
      if (context?.previousLeagues) {
        queryClient.setQueryData(['leagues'], context.previousLeagues)
      }
      
      // Log the error
      reportError(err, 'leaveLeague')
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
    },
  })
}

// Hook for submitting match results with optimistic updates
export function useSubmitMatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (matchData: any) => {
      // This would be implemented with the actual submit match action
      // const result = await submitMatchResult(matchData)
      // if (result.error) throw new Error(result.error.message)
      // return result.data
      
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true }
    },
    onMutate: async (matchData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leagues'] })
      await queryClient.cancelQueries({ queryKey: ['matches'] })

      // Snapshot the previous values
      const previousLeagues = queryClient.getQueryData(['leagues'])
      const previousMatches = queryClient.getQueryData(['matches'])

      // Optimistically update league standings
      queryClient.setQueryData(['leagues'], (old: any) => {
        if (!old) return old

        // Update user leagues with new stats
        const updatedUserLeagues = old.userLeagues?.map((league: UserLeague) => {
          if (league.league.id === matchData.leagueId) {
            return {
              ...league,
              membership: {
                ...league.membership,
                matches_played: (league.membership.matches_played || 0) + 1,
                wins: matchData.isWin ? (league.membership.wins || 0) + 1 : league.membership.wins,
                losses: !matchData.isWin ? (league.membership.losses || 0) + 1 : league.membership.losses,
                points: (league.membership.points || 0) + (matchData.isWin ? 3 : 1),
              }
            }
          }
          return league
        })

        return {
          ...old,
          userLeagues: updatedUserLeagues,
        }
      })

      return { previousLeagues, previousMatches }
    },
    onError: (err, variables, context) => {
      // Roll back optimistic updates
      if (context?.previousLeagues) {
        queryClient.setQueryData(['leagues'], context.previousLeagues)
      }
      if (context?.previousMatches) {
        queryClient.setQueryData(['matches'], context.previousMatches)
      }
      
      reportError(err, 'submitMatch')
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}