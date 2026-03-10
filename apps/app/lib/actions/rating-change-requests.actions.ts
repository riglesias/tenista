import { supabase } from '@/lib/supabase'

export interface RatingChangeRequest {
  id?: string
  player_id: string
  current_rating: number
  requested_rating: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string | null
  reviewed_by?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Check if player can submit a rating change request (90-day cooldown)
 */
export async function canSubmitRatingChangeRequest(playerId: string) {
  
  // Check for any request in the last 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  const { data, error } = await supabase
    .from('rating_change_requests')
    .select('id, created_at')
    .eq('player_id', playerId)
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    // silently handled
    return { canSubmit: false, error: error.message }
  }
  
  const hasRecentRequest = data && data.length > 0
  
  return {
    canSubmit: !hasRecentRequest,
    lastRequestDate: hasRecentRequest ? data[0].created_at : null,
    error: null
  }
}

/**
 * Submit a rating change request
 */
export async function submitRatingChangeRequest(
  playerId: string,
  currentRating: number,
  requestedRating: number,
  reason: string
) {
  
  // First check if player can submit
  const { canSubmit, error: eligibilityError } = await canSubmitRatingChangeRequest(playerId)
  
  if (eligibilityError) {
    return { success: false, error: eligibilityError }
  }
  
  if (!canSubmit) {
    return { 
      success: false, 
      error: 'You can only submit one rating change request every 90 days.' 
    }
  }
  
  // Insert the request
  const { data, error } = await supabase
    .from('rating_change_requests')
    .insert({
      player_id: playerId,
      current_rating: currentRating,
      requested_rating: requestedRating,
      reason: reason,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    // silently handled
    return { success: false, error: 'Failed to submit rating change request' }
  }
  
  return { success: true, data }
}

/**
 * Get rating change requests for a player
 */
export async function getPlayerRatingChangeRequests(playerId: string) {
  
  const { data, error } = await supabase
    .from('rating_change_requests')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
  
  if (error) {
    // silently handled
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

/**
 * Send email notification for rating change request
 */
export async function sendRatingChangeRequestEmail(
  playerName: string,
  playerEmail: string,
  currentRating: number,
  requestedRating: number,
  reason: string
) {
  try {
    
    // Call the Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-rating-change-email', {
      body: {
        playerName,
        playerEmail,
        currentRating,
        requestedRating,
        reason
      }
    })
    
    if (error) {
      // silently handled
      return { success: false, error: 'Failed to send email notification' }
    }
    
    return { success: true, data }
  } catch (error) {
    // silently handled
    return { success: false, error: 'Failed to send email notification' }
  }
}