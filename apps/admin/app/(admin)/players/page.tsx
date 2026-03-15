import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PlayersPageContent } from "@/components/players/players-page-content"

async function getPlayers() {
  const supabase = await createServerSupabaseClient()

  try {
    // Use RPC function to get players with email
    const { data: players, error } = await supabase
      .rpc('get_players_with_email')

    if (error) {
      console.error('Error fetching players:', error.message || 'Unknown error', error)
      return []
    }

    if (!players || players.length === 0) return []

    // Fetch club memberships for all players
    const { data: memberships } = await supabase
      .from('organization_players')
      .select('player_id, organizations(name)')

    // Build a map of player_id -> club name
    const clubMap = new Map<string, string>()
    if (memberships) {
      for (const m of memberships) {
        const orgName = (m.organizations as any)?.name
        if (orgName) clubMap.set(m.player_id, orgName)
      }
    }

    // Merge club_name into player data
    return players.map((p: any) => ({
      ...p,
      club_name: clubMap.get(p.id) || null,
    }))
  } catch (error) {
    console.error('Error in getPlayers:', error)
    return []
  }
}

export default async function PlayersPage() {
  const players = await getPlayers()

  return <PlayersPageContent players={players} />
}
