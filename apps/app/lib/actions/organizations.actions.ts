import { supabase } from '@/lib/supabase'
import { PlayerOrganization } from '@/lib/validation/organization.validation'

export async function getPlayerClub(
  playerId: string
): Promise<{ data: PlayerOrganization | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('organization_players')
      .select('organization_id, added_at, organizations(id, name, court_id)')
      .eq('player_id', playerId)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found — player has no club
        return { data: null, error: null }
      }
      throw error
    }

    const org = data.organizations as any
    return {
      data: {
        organization_id: org.id,
        organization_name: org.name,
        court_id: org.court_id || null,
        added_at: data.added_at,
      },
      error: null,
    }
  } catch (error: any) {
    // silently handled
    return { data: null, error: error.message || 'Failed to get player club' }
  }
}

export async function getOrganizationByCourtId(
  courtId: string
): Promise<{ data: { id: string; name: string; join_code: string | null; image_url: string | null } | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, join_code, image_url')
      .eq('court_id', courtId)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    // silently handled
    return { data: null, error: error.message || 'Failed to get organization' }
  }
}

export async function joinClub(
  playerId: string,
  joinCode: string,
  homecourtId?: string | null
): Promise<{ data: PlayerOrganization | null; error: string | null; errorType?: 'invalid_code' | 'already_member' | 'unknown' }> {
  try {
    // Find organization by join code (case-insensitive)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, court_id')
      .ilike('join_code', joinCode)
      .single()

    if (orgError || !org) {
      return { data: null, error: 'Invalid club code', errorType: 'invalid_code' }
    }

    // Check if already a member of this org
    const { data: existing } = await supabase
      .from('organization_players')
      .select('organization_id')
      .eq('player_id', playerId)
      .eq('organization_id', org.id)
      .single()

    if (existing) {
      return { data: null, error: 'Already a member of this club', errorType: 'already_member' }
    }

    // Remove existing memberships (player can only be in one club)
    await supabase
      .from('organization_players')
      .delete()
      .eq('player_id', playerId)

    // Insert new membership
    const { data: membership, error: insertError } = await supabase
      .from('organization_players')
      .insert({
        player_id: playerId,
        organization_id: org.id,
      })
      .select('added_at')
      .single()

    if (insertError) throw insertError

    // Set homecourt atomically — use club's court_id if provided, or explicit homecourtId
    const courtToSet = homecourtId || org.court_id
    if (courtToSet) {
      await supabase
        .from('players')
        .update({ homecourt_id: courtToSet })
        .eq('id', playerId)
    }

    return {
      data: {
        organization_id: org.id,
        organization_name: org.name,
        court_id: org.court_id || null,
        added_at: membership.added_at,
      },
      error: null,
    }
  } catch (error: any) {
    // silently handled
    return { data: null, error: error.message || 'Failed to join club', errorType: 'unknown' }
  }
}

export async function getAllClubs(): Promise<{
  data: { id: string; name: string; image_url: string | null; member_count: number }[]
  error: string | null
}> {
  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, image_url')
      .order('name')

    if (error) throw error

    // Count members per org
    const { data: memberships } = await supabase
      .from('organization_players')
      .select('organization_id')

    const countMap: Record<string, number> = {}
    if (memberships) {
      for (const m of memberships) {
        countMap[m.organization_id] = (countMap[m.organization_id] || 0) + 1
      }
    }

    return {
      data: (orgs || []).map(org => ({
        ...org,
        member_count: countMap[org.id] || 0,
      })),
      error: null,
    }
  } catch (error: any) {
    // silently handled
    return { data: [], error: error.message || 'Failed to get clubs' }
  }
}

export async function leaveClub(
  playerId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('organization_players')
      .delete()
      .eq('player_id', playerId)

    if (error) throw error

    // Clear homecourt since club and homecourt are coupled
    await supabase
      .from('players')
      .update({ homecourt_id: null })
      .eq('id', playerId)

    return { error: null }
  } catch (error: any) {
    // silently handled
    return { error: error.message || 'Failed to leave club' }
  }
}
