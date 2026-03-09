import { createServerSupabaseClient } from "@/lib/supabase/server"
import { LeaguesPageContent } from "@/components/leagues/leagues-page-content"
import { League, City, Organization } from "@/types/database.types"

interface LeagueWithRelations extends League {
  city?: City
  organization?: { id: string; name: string } | null
  current_players?: number
}

async function getLeagues(): Promise<LeagueWithRelations[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select(`
        *,
        city:cities!city_id(
          id, name, state_province, country_code, country_name
        ),
        organization:organizations!organization_id(
          id, name
        )
      `)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching leagues:', error)
      return []
    }

    if (!leagues) return []

    // Get player counts
    const { data: playerCounts } = await supabase
      .from('league_players')
      .select('league_id')

    const playerCountMap: Record<string, number> = {}
    if (playerCounts) {
      playerCounts.forEach(lp => {
        playerCountMap[lp.league_id] = (playerCountMap[lp.league_id] || 0) + 1
      })
    }

    return leagues.map(league => ({
      ...league,
      current_players: playerCountMap[league.id] || 0
    }))
  } catch (error) {
    console.error('Error in getLeagues:', error)
    return []
  }
}

export default async function LeaguesPage() {
  const leagues = await getLeagues()

  const activeLeagues = leagues.filter(l => l.is_active)
  const upcomingLeagues = leagues.filter(l => {
    const startDate = new Date(l.start_date)
    return startDate > new Date() && l.is_active
  })

  const stats = {
    totalLeagues: leagues.length,
    activeLeagues: activeLeagues.length,
    upcomingLeagues: upcomingLeagues.length,
    totalCapacity: leagues.reduce((sum, l) => sum + l.max_players, 0),
    totalRevenue: leagues
      .filter(l => !l.is_free)
      .reduce((sum, l) => sum + (l.price_cents * l.max_players / 100), 0)
  }

  return <LeaguesPageContent leagues={leagues} cities={[]} stats={stats} />
}
