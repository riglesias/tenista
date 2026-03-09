import { createServerSupabaseClient } from "@/lib/supabase/server"
import { MatchesClient } from "@/components/matches/matches-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { Match, Player, Tournament } from "@/types/database.types"

interface MatchWithRelations extends Match {
  player_a?: Player
  player_b?: Player
  winner?: Player
  tournament?: Tournament
}

async function getMatches(): Promise<MatchWithRelations[]> {
  const supabase = await createServerSupabaseClient()

  try {
    // Get player_matches with correct column names and relationships
    // Using simplified query without explicit foreign key names
    const { data: playerMatches, error: playerMatchesError } = await supabase
      .from('player_matches')
      .select(`
        *,
        player1:players!player1_id(
          id, first_name, last_name, rating
        ),
        player2:players!player2_id(
          id, first_name, last_name, rating
        ),
        winner:players!winner_id(
          id, first_name, last_name, rating
        ),
        league:leagues!league_id(
          id, name, start_date, end_date, location
        )
      `)
      .order('updated_at', { ascending: false })

    console.log('Player matches query result:', {
      error: playerMatchesError,
      dataCount: playerMatches?.length,
      data: playerMatches
    })

    if (playerMatchesError) {
      console.error('Error fetching player_matches:', playerMatchesError)
    }

    if (playerMatches && playerMatches.length > 0) {
      // Transform player_matches data to match our interface
      const transformedMatches = playerMatches.map((match: any) => ({
        ...match,
        player_a_id: match.player1_id,
        player_b_id: match.player2_id,
        player_a: match.player1,
        player_b: match.player2,
        tournament: match.league ? {
          id: match.league.id,
          name: match.league.name,
          start_date: match.league.start_date,
          location: match.league.location,
          status: 'active'
        } : null,
        status: match.is_verified ? 'completed' : 'pending',
        round_number: 1, // Default since player_matches doesn't have rounds
        match_number_in_round: 1,
        is_auto_advanced: false
      }))
      
      return transformedMatches
    }

    // Fallback to matches table if no player_matches
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        player_a:players!matches_player_a_id_fkey(
          id, first_name, last_name, rating
        ),
        player_b:players!matches_player_b_id_fkey(
          id, first_name, last_name, rating
        ),
        winner:players!matches_winner_id_fkey(
          id, first_name, last_name, rating
        ),
        tournament:tournaments(
          id, name, start_date, location, status
        )
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching matches:', error)
      return []
    }

    return matches || []
  } catch (error) {
    console.error('Error in getMatches:', error)
    return []
  }
}

export default async function MatchesPage() {
  const matches = await getMatches()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Matches</h2>
          <p className="text-muted-foreground">
            Manage tournament matches and results
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Match
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">
              All tournament matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.filter(m => {
                const matchDate = new Date(m.updated_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return matchDate > weekAgo
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
          <CardDescription>
            View and manage tournament matches. Click on any match to view details or edit results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchesClient matches={matches} />
        </CardContent>
      </Card>
    </div>
  )
}