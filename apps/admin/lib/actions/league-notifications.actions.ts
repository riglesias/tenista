"use server"

import { createServiceRoleClient } from "@/lib/supabase/service"

interface NewLeagueData {
  id: string
  name: string
  city_id: string | null
  min_rating: number | null
  max_rating: number | null
  is_private: boolean
  organization_id?: string | null
  start_date: string
  division: string | null
}

interface EligiblePlayer {
  auth_user_id: string
  email: string
  first_name: string
}

/**
 * After a league is created, find players who opted in to new league notifications
 * and are eligible for the league, then log notifications (+ send emails in the future).
 */
export async function notifyEligiblePlayers(league: NewLeagueData): Promise<{
  notified: number
  error: string | null
}> {
  try {
    if (!league.city_id) {
      return { notified: 0, error: null }
    }

    // Skip private/club leagues — those are invite-only
    if (league.is_private || league.organization_id) {
      return { notified: 0, error: null }
    }

    const supabase = createServiceRoleClient()

    // Step 1: Get auth user IDs who opted in to new league notifications
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('new_league_notifications', true)

    if (prefsError || !prefs || prefs.length === 0) {
      return { notified: 0, error: prefsError?.message || null }
    }

    const optedInUserIds = prefs.map(p => p.user_id)

    // Step 2: Get players in the same city whose auth_user_id is in the opted-in set
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('auth_user_id, first_name, rating')
      .eq('city_id', league.city_id)
      .eq('is_active', true)
      .in('auth_user_id', optedInUserIds)

    if (playersError || !players || players.length === 0) {
      return { notified: 0, error: playersError?.message || null }
    }

    // Step 3: Filter by rating eligibility
    const eligiblePlayers = players.filter(player => {
      if (!league.min_rating) return true
      const rating = player.rating || 0
      const max = league.max_rating ?? Infinity
      return rating >= league.min_rating && rating <= max
    })

    if (eligiblePlayers.length === 0) {
      return { notified: 0, error: null }
    }

    // Step 4: Get emails from auth.users
    const authUserIds = eligiblePlayers.map(p => p.auth_user_id).filter(Boolean)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authError) {
      return { notified: 0, error: authError.message }
    }

    const authUserMap = new Map(
      authUsers.users
        .filter(u => authUserIds.includes(u.id))
        .map(u => [u.id, u.email])
    )

    const playersWithEmail: EligiblePlayer[] = eligiblePlayers
      .map(p => ({
        auth_user_id: p.auth_user_id!,
        email: authUserMap.get(p.auth_user_id!) || '',
        first_name: p.first_name || '',
      }))
      .filter(p => p.email)

    if (playersWithEmail.length === 0) {
      return { notified: 0, error: null }
    }

    // Step 5: Log notifications
    const divisionLabel = league.division
      ? league.division.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
      : ''

    const notificationInserts = playersWithEmail.map(player => {
      const subject = `New competition available: ${league.name}`
      const body = [
        `Hi ${player.first_name || 'there'},`,
        '',
        'A new competition is now open for registration in your area!',
        '',
        `${league.name}`,
        divisionLabel ? `Division: ${divisionLabel}` : '',
        `Starts: ${league.start_date}`,
        '',
        'Open the Tenista app to join.',
      ].filter(Boolean).join('\n')

      return {
        recipient_user_id: player.auth_user_id,
        notification_type: 'new_league',
        title: subject,
        body,
        data: { league_id: league.id, league_name: league.name, email: player.email },
        status: 'sent' as const,
      }
    })

    await supabase.from('notification_history').insert(notificationInserts)

    // TODO: Wire up actual email delivery via Supabase Edge Function or Resend
    // The notification_history records serve as the queue — an Edge Function
    // can watch for type='new_league' inserts and send emails.

    console.log(`[League Notifications] Logged ${playersWithEmail.length} notifications for "${league.name}"`)

    return { notified: playersWithEmail.length, error: null }
  } catch (error: any) {
    console.error('Error notifying players:', error)
    return { notified: 0, error: error.message || 'Unknown error' }
  }
}
