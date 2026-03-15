import { describe, it, expect } from 'vitest'
import {
  getDivisionFromRating,
  getDivisionInfo,
  isPlayerEligibleForLeague,
  matchFormatToLadderFormat,
  LeagueSchema,
  LeaguePlayerSchema,
  LeagueStandingSchema,
  LeagueWithStatsSchema,
  LadderConfigSchema,
  LadderMatchFormatSchema,
  MatchFormatSchema,
  CompetitionTypeEnum,
  ParticipantTypeEnum,
  DEFAULT_LADDER_CONFIG,
  DEFAULT_LADDER_MATCH_FORMAT,
  DEFAULT_MATCH_FORMAT,
  STANDARD_MATCH_FORMAT,
  type League,
} from '@/lib/validation/leagues.validation'

// ─── getDivisionFromRating ───────────────────────────────────────────────

describe('getDivisionFromRating', () => {
  it('returns division_1 for rating >= 5.0', () => {
    expect(getDivisionFromRating(5.0)).toBe('division_1')
    expect(getDivisionFromRating(6.5)).toBe('division_1')
    expect(getDivisionFromRating(7.0)).toBe('division_1')
  })

  it('returns division_2 for rating 4.0-4.5', () => {
    expect(getDivisionFromRating(4.0)).toBe('division_2')
    expect(getDivisionFromRating(4.5)).toBe('division_2')
    expect(getDivisionFromRating(4.9)).toBe('division_2')
  })

  it('returns division_3 for rating 3.0-3.5', () => {
    expect(getDivisionFromRating(3.0)).toBe('division_3')
    expect(getDivisionFromRating(3.5)).toBe('division_3')
    expect(getDivisionFromRating(3.9)).toBe('division_3')
  })

  it('returns division_4 for rating < 3.0', () => {
    expect(getDivisionFromRating(2.5)).toBe('division_4')
    expect(getDivisionFromRating(1.0)).toBe('division_4')
    expect(getDivisionFromRating(0)).toBe('division_4')
  })
})

// ─── getDivisionInfo ─────────────────────────────────────────────────────

describe('getDivisionInfo', () => {
  it('returns correct info for each division', () => {
    expect(getDivisionInfo('division_1')).toEqual({
      name: 'Division 1',
      range: 'NTRP 5.0+',
      color: '#EF4444',
    })
    expect(getDivisionInfo('division_2')).toEqual({
      name: 'Division 2',
      range: 'NTRP 4.0-4.5',
      color: '#8B5CF6',
    })
    expect(getDivisionInfo('division_3')).toEqual({
      name: 'Division 3',
      range: 'NTRP 3.0-3.5',
      color: '#3B82F6',
    })
    expect(getDivisionInfo('division_4')).toEqual({
      name: 'Division 4',
      range: 'NTRP 1.0-2.5',
      color: '#10B981',
    })
  })

  it('falls back to division_4 for unknown divisions', () => {
    expect(getDivisionInfo('unknown')).toEqual({
      name: 'Division 4',
      range: 'NTRP 1.0-2.5',
      color: '#10B981',
    })
  })
})

// ─── isPlayerEligibleForLeague ───────────────────────────────────────────

describe('isPlayerEligibleForLeague', () => {
  // Use a minimal League-compatible object for testing
  function league(min: number | null, max: number | null): League {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      created_at: '2026-01-01',
      name: 'Test',
      city_id: '00000000-0000-0000-0000-000000000002',
      start_date: '2026-04-01',
      end_date: '2026-06-01',
      max_players: 16,
      min_rating: min,
      max_rating: max,
      is_active: true,
      is_free: true,
      default_points_win: 3,
      default_points_loss: 0,
      division: 'division_3',
      price_cents: null,
      organizer_id: null,
      location: null,
      is_private: false,
      updated_at: null,
      category: null,
      has_playoffs: false,
      image_url: null,
      competition_type: 'round_robin',
      participant_type: 'singles',
      ladder_config: null,
      elimination_format: null,
      match_format: DEFAULT_MATCH_FORMAT,
      organization_id: null,
    }
  }

  it('returns true when no rating restrictions', () => {
    expect(isPlayerEligibleForLeague(3.5, league(null, null))).toBe(true)
  })

  it('returns true when player rating is within range', () => {
    const l = league(3.0, 4.5)
    expect(isPlayerEligibleForLeague(3.5, l)).toBe(true)
    expect(isPlayerEligibleForLeague(3.0, l)).toBe(true)
    expect(isPlayerEligibleForLeague(4.5, l)).toBe(true)
  })

  it('returns false when player rating is below min', () => {
    expect(isPlayerEligibleForLeague(2.5, league(3.0, 4.5))).toBe(false)
  })

  it('returns false when player rating is above max', () => {
    expect(isPlayerEligibleForLeague(5.0, league(3.0, 4.5))).toBe(false)
  })

  it('allows any rating above min when no max_rating', () => {
    const l = league(3.0, null)
    expect(isPlayerEligibleForLeague(3.0, l)).toBe(true)
    expect(isPlayerEligibleForLeague(7.0, l)).toBe(true)
    expect(isPlayerEligibleForLeague(2.9, l)).toBe(false)
  })
})

// ─── matchFormatToLadderFormat ───────────────────────────────────────────

describe('matchFormatToLadderFormat', () => {
  it('converts 1-set format correctly', () => {
    const result = matchFormatToLadderFormat({ number_of_sets: 1 })
    expect(result).toEqual({
      type: 'standard',
      number_of_sets: 1,
      games_per_set: 6,
      final_set_tiebreak: false,
      super_tiebreak_points: 10,
      tiebreak_at_games: 6,
    })
  })

  it('converts 2-set format with tiebreak decider', () => {
    const result = matchFormatToLadderFormat({ number_of_sets: 2 })
    expect(result.number_of_sets).toBe(2)
    expect(result.final_set_tiebreak).toBe(true)
  })

  it('converts 3-set format to standard best-of-3', () => {
    const result = matchFormatToLadderFormat({ number_of_sets: 3 })
    expect(result.number_of_sets).toBe(3)
    expect(result.final_set_tiebreak).toBe(false)
  })

  it('converts 5-set format to best-of-3 (capped)', () => {
    const result = matchFormatToLadderFormat({ number_of_sets: 5 })
    expect(result.number_of_sets).toBe(3)
  })
})

// ─── Zod Schema Validation ──────────────────────────────────────────────

describe('CompetitionTypeEnum', () => {
  it('accepts valid competition types', () => {
    expect(CompetitionTypeEnum.parse('round_robin')).toBe('round_robin')
    expect(CompetitionTypeEnum.parse('ladder')).toBe('ladder')
    expect(CompetitionTypeEnum.parse('playoffs_only')).toBe('playoffs_only')
    expect(CompetitionTypeEnum.parse('elimination')).toBe('elimination')
  })

  it('rejects invalid competition types', () => {
    expect(() => CompetitionTypeEnum.parse('invalid')).toThrow()
  })
})

describe('ParticipantTypeEnum', () => {
  it('accepts singles and doubles', () => {
    expect(ParticipantTypeEnum.parse('singles')).toBe('singles')
    expect(ParticipantTypeEnum.parse('doubles')).toBe('doubles')
  })

  it('rejects invalid types', () => {
    expect(() => ParticipantTypeEnum.parse('mixed')).toThrow()
  })
})

describe('LadderConfigSchema', () => {
  it('applies defaults for empty object', () => {
    const result = LadderConfigSchema.parse({})
    expect(result.max_challenge_positions).toBe(4)
    expect(result.max_active_outgoing_challenges).toBe(1)
    expect(result.rechallenge_cooldown_days).toBe(7)
    expect(result.challenge_acceptance_deadline_days).toBe(2)
    expect(result.match_completion_deadline_days).toBe(5)
    expect(result.inactivity_threshold_days).toBe(7)
    expect(result.inactivity_position_drop).toBe(2)
  })

  it('validates min/max constraints', () => {
    expect(() => LadderConfigSchema.parse({ max_challenge_positions: 0 })).toThrow()
    expect(() => LadderConfigSchema.parse({ max_challenge_positions: 11 })).toThrow()
    expect(LadderConfigSchema.parse({ max_challenge_positions: 10 }).max_challenge_positions).toBe(10)
  })

  it('DEFAULT_LADDER_CONFIG matches schema', () => {
    const result = LadderConfigSchema.parse(DEFAULT_LADDER_CONFIG)
    expect(result).toEqual(DEFAULT_LADDER_CONFIG)
  })
})

describe('LadderMatchFormatSchema', () => {
  it('applies defaults', () => {
    const result = LadderMatchFormatSchema.parse({})
    expect(result.type).toBe('standard')
    expect(result.number_of_sets).toBe(2)
    expect(result.games_per_set).toBe(4)
    expect(result.final_set_tiebreak).toBe(true)
    expect(result.super_tiebreak_points).toBe(10)
  })

  it('validates DEFAULT_LADDER_MATCH_FORMAT', () => {
    expect(LadderMatchFormatSchema.parse(DEFAULT_LADDER_MATCH_FORMAT)).toEqual(DEFAULT_LADDER_MATCH_FORMAT)
  })

  it('validates STANDARD_MATCH_FORMAT', () => {
    expect(LadderMatchFormatSchema.parse(STANDARD_MATCH_FORMAT)).toEqual(STANDARD_MATCH_FORMAT)
  })

  it('rejects invalid games_per_set values', () => {
    expect(() => LadderMatchFormatSchema.parse({ games_per_set: 5 })).toThrow()
  })
})

describe('MatchFormatSchema', () => {
  it('applies default of 3 sets', () => {
    const result = MatchFormatSchema.parse({})
    expect(result.number_of_sets).toBe(3)
  })

  it('accepts valid set counts', () => {
    expect(MatchFormatSchema.parse({ number_of_sets: 1 }).number_of_sets).toBe(1)
    expect(MatchFormatSchema.parse({ number_of_sets: 2 }).number_of_sets).toBe(2)
    expect(MatchFormatSchema.parse({ number_of_sets: 3 }).number_of_sets).toBe(3)
    expect(MatchFormatSchema.parse({ number_of_sets: 5 }).number_of_sets).toBe(5)
  })

  it('rejects invalid set counts', () => {
    expect(() => MatchFormatSchema.parse({ number_of_sets: 4 })).toThrow()
  })
})

describe('LeagueStandingSchema', () => {
  it('validates a complete standing', () => {
    const standing = {
      player_id: '00000000-0000-0000-0000-000000000001',
      player_name: 'Roberto I.',
      player_rating: 3.5,
      nationality_code: 'AR',
      points: 9,
      matches_played: 3,
      wins: 3,
      losses: 0,
      position: 1,
    }
    expect(LeagueStandingSchema.parse(standing)).toEqual(standing)
  })

  it('allows null rating and nationality', () => {
    const standing = {
      player_id: '00000000-0000-0000-0000-000000000001',
      player_name: 'Test Player',
      player_rating: null,
      nationality_code: null,
      points: 0,
      matches_played: 0,
      wins: 0,
      losses: 0,
      position: 1,
    }
    expect(LeagueStandingSchema.parse(standing)).toEqual(standing)
  })
})

describe('LeaguePlayerSchema', () => {
  const basePlayer = {
    id: '00000000-0000-0000-0000-000000000001',
    league_id: '00000000-0000-0000-0000-000000000002',
    player_id: '00000000-0000-0000-0000-000000000003',
    points: 0,
    matches_played: 0,
    wins: 0,
    losses: 0,
  }

  it('parses without status field (optional)', () => {
    const result = LeaguePlayerSchema.parse(basePlayer)
    // .default('active').optional() — when omitted, Zod's .optional() takes precedence
    expect(result.status).toBeUndefined()
  })

  it('status stays undefined when explicitly set to undefined', () => {
    const result = LeaguePlayerSchema.parse({ ...basePlayer, status: undefined })
    // .default('active').optional() — optional wraps default, so undefined passes through
    expect(result.status).toBeUndefined()
  })

  it('accepts retired status', () => {
    const result = LeaguePlayerSchema.parse({ ...basePlayer, status: 'retired' })
    expect(result.status).toBe('retired')
  })

  it('accepts active status', () => {
    const result = LeaguePlayerSchema.parse({ ...basePlayer, status: 'active' })
    expect(result.status).toBe('active')
  })
})

describe('LeagueWithStatsSchema', () => {
  it('requires player_count and user_is_member', () => {
    expect(() =>
      LeagueWithStatsSchema.parse({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test',
      })
    ).toThrow()
  })
})
