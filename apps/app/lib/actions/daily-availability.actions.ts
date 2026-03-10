import { supabase } from '@/lib/supabase'

export async function updateDailyAvailability(
  userId: string,
  available: boolean
) {
  const { data, error } = await supabase
    .from('players')
    .update({
      available_today: available,
      available_today_updated_at: new Date().toISOString(),
      ...(available ? { play_now_notifications_enabled: true } : {}),
    })
    .eq('auth_user_id', userId)
    .select('id, first_name, last_name, rating, city_id')
    .single()

  if (error) {
    // silently handled
    return { data: null, error }
  }

  // If Play Now is being activated, trigger notifications
  if (available && data) {
    try {
      // Call the edge function to send notifications
      const { data: notificationResult, error: notificationError } = await supabase.functions.invoke(
        'trigger-play-now-notifications',
        {
          body: {
            playerId: data.id,
            cityId: data.city_id,
            playerName: `${data.first_name} ${data.last_name}`,
            playerRating: data.rating || 'Unrated'
          }
        }
      )

      if (notificationError) {
        // Failed to send notifications - non-critical
      }
    } catch (err) {
      // silently handled
    }
  }

  return { data, error: null }
}

export async function getPlayerDailyAvailability(userId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('available_today, available_today_updated_at')
    .eq('auth_user_id', userId)
    .single()

  if (error) {
    // silently handled
    return { available: false, error }
  }

  // Check if availability was set today
  if (data?.available_today && data?.available_today_updated_at) {
    const updatedAt = new Date(data.available_today_updated_at)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // If the update was before today, the availability has expired
    if (updatedAt < today) {
      // Optionally, we could update the database here to set available_today to false
      return { available: false, error: null }
    }
    
    return { available: data.available_today, error: null }
  }

  return { available: false, error: null }
}

// Helper function to check if a timestamp is from today
export function isFromToday(timestamp: string | null): boolean {
  if (!timestamp) return false
  
  const date = new Date(timestamp)
  const today = new Date()
  
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}