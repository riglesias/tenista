import { supabase } from '@/lib/supabase'

export interface PlayerCompetition {
  id: string
  type: 'league' | 'playoff' | 'championship'
  name: string
  status: 'active' | 'in_progress' | 'upcoming' | 'ended'
  startDate: string | null
  endDate: string | null
  leagueId?: string
  playoffTournamentId?: string
}

export async function getPlayerActiveCompetitions(playerId: string): Promise<{ data: PlayerCompetition[] | null, error: any }> {
  try {
    const competitions: PlayerCompetition[] = []
    
    // Get active leagues the player is in
    const { data: playerLeagues, error: leaguesError } = await supabase
      .from('league_players')
      .select(`
        league:leagues!inner(
          id,
          name,
          is_active,
          start_date,
          end_date,
          has_playoffs
        )
      `)
      .eq('player_id', playerId)

    if (leaguesError) throw leaguesError

    // Add active leagues to competitions
    if (playerLeagues) {
      const now = new Date()
      
      playerLeagues.forEach((lp: any) => {
        const league = lp.league
        if (!league) return
        
        const startDate = league.start_date ? new Date(league.start_date) : null
        const endDate = league.end_date ? new Date(league.end_date) : null
        
        let status: PlayerCompetition['status'] = 'active'
        if (!league.is_active) {
          status = 'ended'
        } else if (startDate && now < startDate) {
          status = 'upcoming'
        } else if (endDate && now > endDate) {
          status = 'ended'
        }
        
        competitions.push({
          id: league.id,
          type: 'league',
          name: league.name,
          status,
          startDate: league.start_date,
          endDate: league.end_date,
          leagueId: league.id
        })
      })
    }

    // Get active playoff tournaments the player is in
    const { data: playoffParticipations, error: playoffError } = await supabase
      .from('playoff_participants')
      .select(`
        playoff_tournament:playoff_tournaments!inner(
          id,
          league_id,
          status,
          start_date,
          created_at,
          updated_at,
          league:leagues!inner(
            name
          )
        )
      `)
      .eq('player_id', playerId)

    if (playoffError) throw playoffError

    // Add active playoffs to competitions
    if (playoffParticipations) {
      const now = new Date()

      playoffParticipations.forEach((pp: any) => {
        const tournament = pp.playoff_tournament
        if (!tournament) return

        const tournamentStartDate = tournament.start_date ? new Date(tournament.start_date) : null

        let status: PlayerCompetition['status'] = 'active'
        if (tournament.status === 'completed') {
          status = 'ended'
        } else if (tournament.status === 'not_started') {
          // Use start_date to derive client-side status
          status = tournamentStartDate && now >= tournamentStartDate ? 'in_progress' : 'upcoming'
        } else if (tournament.status === 'in_progress') {
          status = 'in_progress'
        }

        competitions.push({
          id: tournament.id,
          type: 'playoff',
          name: `${tournament.league.name} - Playoffs`,
          status,
          startDate: tournament.start_date || tournament.created_at,
          endDate: tournament.updated_at,
          leagueId: tournament.league_id,
          playoffTournamentId: tournament.id
        })
      })
    }

    // TODO: Add championship competitions when implemented
    
    return { data: competitions, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function validateCompetitionMatch(
  playerId: string, 
  opponentId: string, 
  competitionType: 'league' | 'playoff' | 'championship',
  competitionId: string
): Promise<{ valid: boolean, error?: string }> {
  try {
    if (competitionType === 'league') {
      // Check both players are in the league
      const { data: players, error } = await supabase
        .from('league_players')
        .select('player_id')
        .eq('league_id', competitionId)
        .in('player_id', [playerId, opponentId])
      
      if (error) throw error
      if (!players || players.length !== 2) {
        return { valid: false, error: 'Both players must be in the selected league' }
      }
      
      return { valid: true }
    } else if (competitionType === 'playoff') {
      // Check if there's a pending playoff match between these players
      const { data: matches, error } = await supabase
        .from('playoff_matches')
        .select(`
          id,
          player1_id,
          player2_id,
          status,
          playoff_round:playoff_rounds!inner(
            playoff_tournament_id
          )
        `)
        .or(`player1_id.eq.${playerId},player1_id.eq.${opponentId}`)
        .or(`player2_id.eq.${playerId},player2_id.eq.${opponentId}`)
        .eq('status', 'pending')
      
      if (error) throw error
      
      // Find match in the specified tournament
      const validMatch = matches?.find((match: any) => {
        const isCorrectTournament = match.playoff_round.playoff_tournament_id === competitionId
        const hasCorrectPlayers = 
          (match.player1_id === playerId && match.player2_id === opponentId) ||
          (match.player1_id === opponentId && match.player2_id === playerId)
        return isCorrectTournament && hasCorrectPlayers
      })
      
      if (!validMatch) {
        return { valid: false, error: 'No pending playoff match found between these players' }
      }
      
      return { valid: true }
    }
    
    return { valid: false, error: 'Invalid competition type' }
  } catch (error) {
    return { valid: false, error: 'Failed to validate match' }
  }
}