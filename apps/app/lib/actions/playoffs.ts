import { supabase } from '@/lib/supabase'
import {
  PlayoffTournament,
  PlayoffParticipant,
  PlayoffRound,
  PlayoffMatch,
  QualifiedPlayer,
  BracketData,
  BracketSection,
  BracketType,
  FeedInBracketData,
  CreatePlayoffTournament,
  UpdatePlayoffTournamentStatus,
  SubmitPlayoffMatchResult,
  PlayoffTournamentWithParticipants,
  PlayoffTournamentWithFullData,
  calculateBracketSize,
  calculateTotalRounds,
  calculateByeCount,
  getRoundName,
  validatePlayoffCreation,
  validatePlayoffMatchSubmission
} from '@/lib/validation/playoffs.validation'
import { BracketService } from '@/lib/services/bracketService'
import { FeedInBracketService } from '@/lib/services/feedInBracketService'
import { QualificationService } from '@/lib/services/qualificationService'
import { TournamentService } from '@/lib/services/tournamentService'
import { PlayoffMatchIntegrationService } from '@/lib/services/playoffMatchIntegrationService'
import { PlayoffEdgeCaseService } from '@/lib/services/playoffEdgeCaseService'
import { Database } from '@/lib/database.types'

type PlayoffTournamentRow = Database['public']['Tables']['playoff_tournaments']['Row']
type PlayoffParticipantRow = Database['public']['Tables']['playoff_participants']['Row']
type PlayoffRoundRow = Database['public']['Tables']['playoff_rounds']['Row']
type PlayoffMatchRow = Database['public']['Tables']['playoff_matches']['Row']

/**
 * Get playoff tournament for a league
 */
export async function getPlayoffTournament(leagueId: string): Promise<PlayoffTournament | null> {
  // Using imported supabase client
  
  const { data, error } = await supabase
    .from('playoff_tournaments')
    .select('*')
    .eq('league_id', leagueId)
    .single()
    
  if (error) {
    if (error.code === 'PGRST116') {
      return null // No tournament found
    }
    throw new Error(`Failed to get playoff tournament: ${error.message}`)
  }
  
  return data as PlayoffTournament
}

/**
 * Get playoff tournament with participants
 */
export async function getPlayoffTournamentWithParticipants(leagueId: string): Promise<PlayoffTournamentWithParticipants | null> {
  // Using imported supabase client
  
  const { data, error } = await supabase
    .from('playoff_tournaments')
    .select(`
      *,
      participants:playoff_participants(
        *,
        player:players(
          id,
          first_name,
          last_name,
          rating,
          nationality_code
        )
      )
    `)
    .eq('league_id', leagueId)
    .single()
    
  if (error) {
    if (error.code === 'PGRST116') {
      return null // No tournament found
    }
    throw new Error(`Failed to get playoff tournament with participants: ${error.message}`)
  }
  
  return data as PlayoffTournamentWithParticipants
}

/**
 * Get playoff tournament with full data (participants, rounds, matches)
 */
export async function getPlayoffTournamentWithFullData(leagueId: string): Promise<PlayoffTournamentWithFullData | null> {
  // Using imported supabase client
  
  const { data, error } = await supabase
    .from('playoff_tournaments')
    .select(`
      *,
      participants:playoff_participants(
        *,
        player:players(
          id,
          first_name,
          last_name,
          rating,
          nationality_code
        )
      ),
      rounds:playoff_rounds(
        *,
        matches:playoff_matches(
          *,
          player1:players!playoff_matches_player1_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            nationality_code
          ),
          player2:players!playoff_matches_player2_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            nationality_code
          ),
          winner:players!playoff_matches_winner_id_fkey(
            id,
            first_name,
            last_name,
            rating,
            nationality_code
          )
        )
      )
    `)
    .eq('league_id', leagueId)
    .single()
    
  if (error) {
    if (error.code === 'PGRST116') {
      return null // No tournament found
    }
    throw new Error(`Failed to get playoff tournament with full data: ${error.message}`)
  }
  
  return data as PlayoffTournamentWithFullData
}

/**
 * Get qualifying players for a league based on standings
 */
export async function getQualifyingPlayers(leagueId: string, count: number): Promise<QualifiedPlayer[]> {
  // Using imported supabase client
  
  const { data, error } = await supabase
    .from('league_players')
    .select(`
      points,
      wins,
      losses,
      matches_played,
      player:players(
        id,
        first_name,
        last_name,
        rating
      )
    `)
    .eq('league_id', leagueId)
    .order('points', { ascending: false })
    .order('wins', { ascending: false })
    .order('losses', { ascending: true })
    .limit(count)
    
  if (error) {
    throw new Error(`Failed to get qualifying players: ${error.message}`)
  }
  
  return data.map((item: { player: { id: string; first_name: string | null; last_name: string | null; rating: number | null }; points: number | null }, index: number) => ({
    id: item.player.id,
    firstName: item.player.first_name,
    lastName: item.player.last_name,
    seedPosition: index + 1,
    leaguePosition: index + 1,
    leaguePoints: item.points || 0,
    rating: item.player.rating,
  })) as QualifiedPlayer[]
}

/**
 * Generate bracket structure for tournament using advanced bracket service
 */
function generateBracket(players: QualifiedPlayer[], bracketType: BracketType = 'main'): BracketData | FeedInBracketData {
  if (bracketType === 'feed_in_consolation') {
    return FeedInBracketService.generateFeedInBracket({
      players,
      seedingMethod: 'standard',
      guaranteedMatches: 3
    })
  }

  return BracketService.generateBracket({
    players,
    seedingMethod: 'standard',
    byeDistribution: 'traditional' // Matches preview: top seeds get byes, then top vs bottom pairing
  })
}

/**
 * Create playoff tournament for a league
 */
export async function createPlayoffTournament(data: CreatePlayoffTournament): Promise<PlayoffTournament> {
  // Using imported supabase client
  const bracketType: BracketType = data.bracket_type || 'main'

  // First, get league info including competition type
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('end_date, has_playoffs, competition_type')
    .eq('id', data.league_id)
    .single()

  if (leagueError) {
    throw new Error(`Failed to get league: ${leagueError.message}`)
  }

  const isStandaloneTournament = league.competition_type === 'playoffs_only'
  const qualificationService = new QualificationService()
  let qualifyingPlayers: QualifiedPlayer[]

  if (isStandaloneTournament) {
    // For standalone tournaments, get participant IDs from league_players
    const { data: participants, error: participantsError } = await supabase
      .from('league_players')
      .select('player_id')
      .eq('league_id', data.league_id)

    if (participantsError) {
      throw new Error(`Failed to get tournament participants: ${participantsError.message}`)
    }

    const participantIds = (participants || []).map(p => p.player_id)

    if (participantIds.length < 2) {
      throw new Error('At least 2 players are required to start the tournament')
    }

    // Use standalone qualification (seeded by last 12 months W-L record)
    const standaloneResult = await qualificationService.getQualifiedPlayersForStandaloneTournament(
      participantIds
    )

    // Map standalone players to the QualifiedPlayer format
    qualifyingPlayers = standaloneResult.qualifiedPlayers.map(p => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      seedPosition: p.seedPosition,
      leaguePosition: p.seedPosition, // Use seed position as "league position" for standalone
      leaguePoints: p.winPercentage, // Use win percentage as "points" for standalone
      rating: p.rating,
    }))
  } else {
    // For regular leagues, use league standings for qualification
    const qualificationResult = await qualificationService.getQualifiedPlayers({
      leagueId: data.league_id,
      qualifyingCount: data.qualifying_players_count,
      minMatchesPlayed: 1,
      excludeInactivePlayers: true
    })
    qualifyingPlayers = qualificationResult.qualifiedPlayers

    // Validate playoff creation (only for regular leagues)
    const validationError = validatePlayoffCreation(league, qualifyingPlayers.length)
    if (validationError) {
      throw new Error(validationError)
    }
  }

  // Additional validation for feed-in consolation
  if (bracketType === 'feed_in_consolation' && qualifyingPlayers.length < 4) {
    throw new Error('Feed-in consolation requires at least 4 players')
  }

  // Generate bracket based on type
  const bracketData = generateBracket(qualifyingPlayers, bracketType)

  // Calculate total rounds based on bracket type
  let totalRounds: number
  if (bracketType === 'feed_in_consolation') {
    // For feed-in, total rounds considers all sections
    const feedInData = bracketData as FeedInBracketData
    totalRounds = feedInData.sections.main.totalRounds
  } else {
    totalRounds = calculateTotalRounds(calculateBracketSize(qualifyingPlayers.length))
  }

  // Create tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('playoff_tournaments')
    .insert({
      league_id: data.league_id,
      status: 'not_started',
      total_rounds: totalRounds,
      qualifying_players_count: data.qualifying_players_count,
      bracket_type: bracketType,
      bracket_data: bracketData,
      start_date: data.start_date || league.end_date,
    })
    .select()
    .single()

  if (tournamentError) {
    throw new Error(`Failed to create playoff tournament: ${tournamentError.message}`)
  }

  // Create participants with feed-in tracking fields
  const participantsData = qualifyingPlayers.map(player => ({
    playoff_tournament_id: tournament.id,
    player_id: player.id,
    seed_position: player.seedPosition,
    league_position: player.leaguePosition,
    league_points: player.leaguePoints,
    matches_played: 0,
    current_section: 'main' as const,
  }))

  const { error: participantsError } = await supabase
    .from('playoff_participants')
    .insert(participantsData)

  if (participantsError) {
    throw new Error(`Failed to create playoff participants: ${participantsError.message}`)
  }

  // Create rounds and matches based on bracket type
  if (bracketType === 'feed_in_consolation') {
    await createFeedInRoundsAndMatches(tournament.id, bracketData as FeedInBracketData)
  } else {
    await createStandardRoundsAndMatches(tournament.id, bracketData as BracketData)
  }

  return tournament as PlayoffTournament
}

/**
 * Create rounds and matches for standard single-elimination bracket
 */
async function createStandardRoundsAndMatches(tournamentId: string, bracketData: BracketData): Promise<void> {
  // Create rounds
  const roundsData = bracketData.rounds.map(round => ({
    playoff_tournament_id: tournamentId,
    round_number: round.roundNumber,
    round_name: round.roundName,
    bracket_section: 'main' as const,
    status: 'not_started' as const,
  }))

  const { data: rounds, error: roundsError } = await supabase
    .from('playoff_rounds')
    .insert(roundsData)
    .select()

  if (roundsError) {
    throw new Error(`Failed to create playoff rounds: ${roundsError.message}`)
  }

  // Create matches for each round
  for (let i = 0; i < bracketData.rounds.length; i++) {
    const round = bracketData.rounds[i]
    const roundData = rounds[i]

    const matchesData = round.matches.map(match => ({
      playoff_round_id: roundData.id,
      match_number: match.matchNumber,
      player1_id: match.player1?.id || null,
      player2_id: match.player2?.id || null,
      winner_id: match.winner?.id || null,
      is_bye: match.isBye,
      bracket_section: 'main' as const,
      status: match.status as 'pending' | 'completed' | 'bye',
    }))

    const { error: matchesError } = await supabase
      .from('playoff_matches')
      .insert(matchesData)

    if (matchesError) {
      throw new Error(`Failed to create playoff matches for round ${i + 1}: ${matchesError.message}`)
    }
  }
}

/**
 * Create rounds and matches for feed-in consolation bracket
 */
async function createFeedInRoundsAndMatches(tournamentId: string, bracketData: FeedInBracketData): Promise<void> {
  const sections: Array<{ key: keyof FeedInBracketData['sections']; section: BracketSection }> = [
    { key: 'main', section: 'main' },
    { key: 'consolation', section: 'consolation' },
    { key: 'feedIn', section: 'feed_in' },
    { key: 'backdraw', section: 'backdraw' },
  ]

  for (const { key, section } of sections) {
    const sectionData = bracketData.sections[key]
    if (!sectionData || sectionData.rounds.length === 0) continue

    // Create rounds for this section
    const roundsData = sectionData.rounds.map(round => ({
      playoff_tournament_id: tournamentId,
      round_number: round.roundNumber,
      round_name: round.roundName,
      bracket_section: section,
      status: 'not_started' as const,
    }))

    const { data: rounds, error: roundsError } = await supabase
      .from('playoff_rounds')
      .insert(roundsData)
      .select()

    if (roundsError) {
      throw new Error(`Failed to create ${section} rounds: ${roundsError.message}`)
    }

    // Create matches for each round in this section
    for (let i = 0; i < sectionData.rounds.length; i++) {
      const round = sectionData.rounds[i]
      const roundData = rounds[i]

      const matchesData = round.matches.map(match => ({
        playoff_round_id: roundData.id,
        match_number: match.matchNumber,
        player1_id: match.player1?.id || null,
        player2_id: match.player2?.id || null,
        winner_id: match.winner?.id || null,
        is_bye: match.isBye,
        bracket_section: section,
        source_match_id: match.sourceMatchId || null,
        status: match.status as 'pending' | 'completed' | 'bye',
      }))

      const { error: matchesError } = await supabase
        .from('playoff_matches')
        .insert(matchesData)

      if (matchesError) {
        throw new Error(`Failed to create ${section} matches for round ${i + 1}: ${matchesError.message}`)
      }
    }
  }
}

/**
 * Get playoff tournament by section (for feed-in consolation)
 */
export async function getPlayoffTournamentBySection(
  leagueId: string,
  section: BracketSection
): Promise<{ rounds: PlayoffRound[]; matches: PlayoffMatch[] } | null> {
  const { data: tournament } = await supabase
    .from('playoff_tournaments')
    .select('id')
    .eq('league_id', leagueId)
    .single()

  if (!tournament) return null

  const { data: rounds, error: roundsError } = await supabase
    .from('playoff_rounds')
    .select(`
      *,
      matches:playoff_matches(
        *,
        player1:players!playoff_matches_player1_id_fkey(
          id, first_name, last_name, rating, nationality_code
        ),
        player2:players!playoff_matches_player2_id_fkey(
          id, first_name, last_name, rating, nationality_code
        ),
        winner:players!playoff_matches_winner_id_fkey(
          id, first_name, last_name, rating, nationality_code
        )
      )
    `)
    .eq('playoff_tournament_id', tournament.id)
    .eq('bracket_section', section)
    .order('round_number')

  if (roundsError) {
    throw new Error(`Failed to get tournament section: ${roundsError.message}`)
  }

  const allMatches = rounds?.flatMap((r: PlayoffRound & { matches?: PlayoffMatch[] }) => r.matches || []) || []

  return {
    rounds: rounds as PlayoffRound[],
    matches: allMatches as PlayoffMatch[]
  }
}

/**
 * Get participant match progress (for feed-in consolation)
 */
export async function getParticipantMatchProgress(
  tournamentId: string
): Promise<Array<{ playerId: string; matchesPlayed: number; currentSection: string }>> {
  const { data, error } = await supabase
    .from('playoff_participants')
    .select('player_id, matches_played, current_section')
    .eq('playoff_tournament_id', tournamentId)

  if (error) {
    throw new Error(`Failed to get participant progress: ${error.message}`)
  }

  return data.map((p: { player_id: string; matches_played: number | null; current_section: string | null }) => ({
    playerId: p.player_id,
    matchesPlayed: p.matches_played || 0,
    currentSection: p.current_section || 'main'
  }))
}

/**
 * Update playoff tournament status
 */
export async function updatePlayoffTournamentStatus(data: UpdatePlayoffTournamentStatus): Promise<PlayoffTournament> {
  // Using imported supabase client
  
  const { data: tournament, error } = await supabase
    .from('playoff_tournaments')
    .update({ 
      status: data.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.tournament_id)
    .select()
    .single()
    
  if (error) {
    throw new Error(`Failed to update playoff tournament status: ${error.message}`)
  }
  
  return tournament as PlayoffTournament
}

/**
 * Submit playoff match result using integration service
 */
export async function submitPlayoffMatchResult(data: SubmitPlayoffMatchResult): Promise<PlayoffMatch> {
  // This function signature is maintained for backward compatibility
  // The actual logic should use the integration service's submitPlayoffMatch method
  // which handles the full workflow including player_match creation
  
  const integrationService = new PlayoffMatchIntegrationService()
  
  // Get current user for submitted_by field
  // Using imported supabase client
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
    
  if (playerError) {
    throw new Error(`Failed to get player: ${playerError.message}`)
  }
  
  // For now, we'll use the simple approach
  // In a full implementation, you'd want to use the integration service
  const tournamentService = new TournamentService()
  const result = await tournamentService.processMatchCompletion(
    data.playoff_match_id,
    data.winner_id,
    data.player_match_id
  )
  
  if (!result.success) {
    throw new Error(result.message)
  }
  
  // Return the updated match
  const { data: updatedMatch, error } = await supabase
    .from('playoff_matches')
    .select('*')
    .eq('id', data.playoff_match_id)
    .single()
    
  if (error) {
    throw new Error(`Failed to get updated match: ${error.message}`)
  }
  
  return updatedMatch as PlayoffMatch
}

/**
 * Get playoff matches for a specific round
 */
export async function getPlayoffRoundMatches(roundId: string): Promise<PlayoffMatch[]> {
  // Using imported supabase client
  
  const { data, error } = await supabase
    .from('playoff_matches')
    .select(`
      *,
      player1:players!playoff_matches_player1_id_fkey(
        id,
        first_name,
        last_name,
        rating,
        country_code
      ),
      player2:players!playoff_matches_player2_id_fkey(
        id,
        first_name,
        last_name,
        rating,
        country_code
      ),
      winner:players!playoff_matches_winner_id_fkey(
        id,
        first_name,
        last_name,
        rating,
        country_code
      )
    `)
    .eq('playoff_round_id', roundId)
    .order('match_number')
    
  if (error) {
    throw new Error(`Failed to get playoff round matches: ${error.message}`)
  }
  
  return data as PlayoffMatch[]
}

/**
 * Get all playoff rounds for a tournament
 */
export async function getPlayoffRounds(tournamentId: string): Promise<PlayoffRound[]> {
  // Using imported supabase client
  
  const { data, error } = await supabase
    .from('playoff_rounds')
    .select('*')
    .eq('playoff_tournament_id', tournamentId)
    .order('round_number')
    
  if (error) {
    throw new Error(`Failed to get playoff rounds: ${error.message}`)
  }
  
  return data as PlayoffRound[]
}

/**
 * Check if current user can manage playoffs for a league
 */
export async function canUserManagePlayoffs(leagueId: string): Promise<boolean> {
  // Using imported supabase client
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }
  
  // Check if user is the league organizer
  const { data: league, error } = await supabase
    .from('leagues')
    .select('organizer_id, players!inner(auth_user_id)')
    .eq('id', leagueId)
    .eq('players.auth_user_id', user.id)
    .single()
    
  if (error) {
    return false
  }
  
  // User can manage if they are the organizer
  const { data: organizer } = await supabase
    .from('players')
    .select('auth_user_id')
    .eq('id', league.organizer_id)
    .single()
    
  return organizer?.auth_user_id === user.id
}

/**
 * Delete playoff tournament (for organizers only)
 */
export async function deletePlayoffTournament(tournamentId: string): Promise<void> {
  // Using imported supabase client

  const { error } = await supabase
    .from('playoff_tournaments')
    .delete()
    .eq('id', tournamentId)

  if (error) {
    throw new Error(`Failed to delete playoff tournament: ${error.message}`)
  }
}

/**
 * Start an existing playoff tournament (change status from not_started to in_progress)
 */
export async function startPlayoffTournament(tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('playoff_tournaments')
    .update({ status: 'in_progress' })
    .eq('id', tournamentId)

  if (error) {
    throw new Error(`Failed to start tournament: ${error.message}`)
  }
}

/**
 * Suspend an in-progress playoff tournament
 */
export async function suspendPlayoffTournament(tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('playoff_tournaments')
    .update({ status: 'suspended' })
    .eq('id', tournamentId)

  if (error) {
    throw new Error(`Failed to suspend tournament: ${error.message}`)
  }
}

/**
 * Resume a suspended playoff tournament
 */
export async function resumePlayoffTournament(tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('playoff_tournaments')
    .update({ status: 'in_progress' })
    .eq('id', tournamentId)

  if (error) {
    throw new Error(`Failed to resume tournament: ${error.message}`)
  }
}

/**
 * Advance to the next round of a playoff tournament.
 * Marks the current in_progress round as completed and the next round as in_progress.
 * Also updates the tournament's current_round field.
 */
export async function advancePlayoffRound(tournamentId: string): Promise<void> {
  // Get all rounds ordered by round_number
  const { data: rounds, error: roundsError } = await supabase
    .from('playoff_rounds')
    .select('id, round_number, status')
    .eq('playoff_tournament_id', tournamentId)
    .order('round_number')

  if (roundsError) {
    throw new Error(`Failed to get rounds: ${roundsError.message}`)
  }

  if (!rounds || rounds.length === 0) {
    throw new Error('No rounds found for this tournament')
  }

  // Find the current in_progress round
  const currentRound = rounds.find(r => r.status === 'in_progress')
  if (!currentRound) {
    // If no round is in_progress, start the first not_started round
    const firstNotStarted = rounds.find(r => r.status === 'not_started')
    if (!firstNotStarted) {
      throw new Error('All rounds are already completed')
    }

    const { error } = await supabase
      .from('playoff_rounds')
      .update({ status: 'in_progress' })
      .eq('id', firstNotStarted.id)

    if (error) {
      throw new Error(`Failed to start round: ${error.message}`)
    }

    // Update tournament current_round
    await supabase
      .from('playoff_tournaments')
      .update({ current_round: firstNotStarted.round_number })
      .eq('id', tournamentId)

    return
  }

  // Verify all matches in current round are completed or bye
  const { data: matches, error: matchesError } = await supabase
    .from('playoff_matches')
    .select('id, status')
    .eq('playoff_round_id', currentRound.id)

  if (matchesError) {
    throw new Error(`Failed to check round matches: ${matchesError.message}`)
  }

  const incompleteMatches = (matches || []).filter(
    m => m.status !== 'completed' && m.status !== 'bye'
  )

  if (incompleteMatches.length > 0) {
    throw new Error(
      `Cannot advance: ${incompleteMatches.length} match(es) in the current round are not yet completed`
    )
  }

  // Mark current round as completed
  const { error: completeError } = await supabase
    .from('playoff_rounds')
    .update({ status: 'completed' })
    .eq('id', currentRound.id)

  if (completeError) {
    throw new Error(`Failed to complete current round: ${completeError.message}`)
  }

  // Find the next round
  const nextRound = rounds.find(
    r => r.round_number > currentRound.round_number && r.status === 'not_started'
  )

  if (nextRound) {
    // Start next round
    const { error: startError } = await supabase
      .from('playoff_rounds')
      .update({ status: 'in_progress' })
      .eq('id', nextRound.id)

    if (startError) {
      throw new Error(`Failed to start next round: ${startError.message}`)
    }

    // Update tournament current_round
    await supabase
      .from('playoff_tournaments')
      .update({ current_round: nextRound.round_number })
      .eq('id', tournamentId)
  } else {
    // No more rounds — mark tournament as completed
    const { error: tournamentError } = await supabase
      .from('playoff_tournaments')
      .update({ status: 'completed' })
      .eq('id', tournamentId)

    if (tournamentError) {
      throw new Error(`Failed to complete tournament: ${tournamentError.message}`)
    }
  }
}

/**
 * Reset playoff tournament to not_started state
 * DEV/TEST ONLY - not exposed in UI
 * Clears all match results and resets statuses while keeping the bracket structure
 */
export async function resetPlayoffTournament(tournamentId: string): Promise<void> {
  // Get all rounds for this tournament
  const { data: rounds, error: roundsError } = await supabase
    .from('playoff_rounds')
    .select('id')
    .eq('playoff_tournament_id', tournamentId)

  if (roundsError) {
    throw new Error(`Failed to get rounds: ${roundsError.message}`)
  }

  const roundIds = (rounds || []).map(r => r.id)

  // Reset all non-bye matches to pending status with no winner
  if (roundIds.length > 0) {
    const { error: matchesError } = await supabase
      .from('playoff_matches')
      .update({
        winner_id: null,
        status: 'pending',
        player_match_id: null
      })
      .in('playoff_round_id', roundIds)
      .eq('is_bye', false)

    if (matchesError) {
      throw new Error(`Failed to reset matches: ${matchesError.message}`)
    }

    // Reset all rounds to not_started
    const { error: roundUpdateError } = await supabase
      .from('playoff_rounds')
      .update({ status: 'not_started' })
      .eq('playoff_tournament_id', tournamentId)

    if (roundUpdateError) {
      throw new Error(`Failed to reset rounds: ${roundUpdateError.message}`)
    }
  }

  // Reset tournament status to not_started
  const { error: tournamentError } = await supabase
    .from('playoff_tournaments')
    .update({ status: 'not_started' })
    .eq('id', tournamentId)

  if (tournamentError) {
    throw new Error(`Failed to reset tournament: ${tournamentError.message}`)
  }
}