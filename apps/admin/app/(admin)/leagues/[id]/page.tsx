import { createServerSupabaseClient } from "@/lib/supabase/server"
import { LeagueDetailClient } from "@/components/leagues/league-detail-client"
import { notFound } from "next/navigation"
import { League, City, Player, Organization, Court } from "@/types/database.types"

interface LeagueWithRelations extends League {
  city?: City
  current_players?: number
}

interface LeaguePlayer {
  id: string
  league_id: string
  player_id: string
  points: number
  matches_played: number
  wins: number
  losses: number
  player?: Player
}

async function getLeague(id: string): Promise<LeagueWithRelations | null> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: league, error } = await supabase
      .from('leagues')
      .select(`
        *,
        city:cities!city_id(
          id, name, state_province, country_code, country_name
        )
      `)
      .eq('id', id)
      .single()

    if (error || !league) {
      console.error('Error fetching league:', error)
      return null
    }

    // Get player count
    const { count } = await supabase
      .from('league_players')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', id)

    return {
      ...league,
      current_players: count || 0
    }
  } catch (error) {
    console.error('Error in getLeague:', error)
    return null
  }
}

async function getLeaguePlayers(leagueId: string): Promise<LeaguePlayer[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('league_players')
      .select(`
        *,
        player:players!player_id(
          id, first_name, last_name, rating, country_code
        )
      `)
      .eq('league_id', leagueId)
      .order('points', { ascending: false })

    if (error) {
      console.error('Error fetching league players:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getLeaguePlayers:', error)
    return []
  }
}

async function getCities(): Promise<City[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching cities:', error)
      return []
    }

    return cities || []
  } catch (error) {
    console.error('Error in getCities:', error)
    return []
  }
}

async function getOrganizations(): Promise<Organization[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching organizations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getOrganizations:', error)
    return []
  }
}

async function getCourtsMap(): Promise<Record<string, string>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data } = await supabase.from('courts').select('id, name')
    const map: Record<string, string> = {}
    if (data) data.forEach(c => { map[c.id] = c.name })
    return map
  } catch {
    return {}
  }
}

export default async function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [league, leaguePlayers, cities, organizations, courtsMap] = await Promise.all([
    getLeague(id),
    getLeaguePlayers(id),
    getCities(),
    getOrganizations(),
    getCourtsMap()
  ])

  if (!league) {
    notFound()
  }

  return <LeagueDetailClient league={league} players={leaguePlayers} cities={cities} organizations={organizations} courtsMap={courtsMap} />
}