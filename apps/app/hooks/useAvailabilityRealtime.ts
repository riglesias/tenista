'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook to subscribe to realtime availability changes for players in a city.
 * When another player's `available_today` changes, the callback is invoked
 * so the caller can refresh the player list.
 *
 * @param cityId - The city to watch for availability changes
 * @param currentUserId - The current auth user ID (changes from self are skipped)
 * @param onAvailabilityChange - Callback invoked when a remote player's availability changes
 */
export function useAvailabilityRealtime(
  cityId: string | null,
  currentUserId: string | null,
  onAvailabilityChange: () => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!cityId) return

    const channelName = `availability-${cityId}`

    const channel = supabase
      .channel(channelName)
      .on<{
        id: string
        auth_user_id: string | null
        available_today: boolean | null
        city_id: string | null
      }>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `city_id=eq.${cityId}`,
        },
        (payload) => {
          const oldRecord = payload.old as { available_today?: boolean | null; auth_user_id?: string | null }
          const newRecord = payload.new

          // Only react to actual availability changes
          if (oldRecord.available_today === newRecord.available_today) return

          // Skip own user's changes (already handled optimistically)
          if (currentUserId && newRecord.auth_user_id === currentUserId) return

          console.log('[Realtime] Availability change detected:', newRecord.id, newRecord.available_today)
          onAvailabilityChange()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Availability subscription status:', status)
      })

    channelRef.current = channel

    return () => {
      console.log('[Realtime] Unsubscribing from availability channel:', channelName)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [cityId, currentUserId, onAvailabilityChange])
}
