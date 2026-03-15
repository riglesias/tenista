import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Constants ──────────────────────────────────────────────────────────
const UUID1 = '00000000-0000-0000-0000-000000000001'
const UUID2 = '00000000-0000-0000-0000-000000000002'
const UUID3 = '00000000-0000-0000-0000-000000000003'
const UUID_CITY = '11111111-1111-1111-1111-111111111111'
const UUID_ORG = '22222222-2222-2222-2222-222222222222'
const UUID_USER = '33333333-3333-3333-3333-333333333333'

// ─── Mock Supabase ──────────────────────────────────────────────────────

function createQueryBuilder(resolvedValue: { data: any; error: any; count?: number | null }) {
  const builder: any = {}
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'in', 'not', 'or', 'is', 'order', 'limit', 'range',
    'single', 'maybeSingle', 'head', 'csv',
    'filter', 'match', 'contains', 'containedBy',
    'textSearch', 'explain',
  ]
  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }
  Object.defineProperty(builder, 'then', {
    value: (onFulfilled: any) => Promise.resolve(resolvedValue).then(onFulfilled),
  })
  return builder
}

const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}))

vi.mock('react-native-url-polyfill/auto', () => ({}))

// ─── Helpers ────────────────────────────────────────────────────────────

function makeRawLeague(overrides: Record<string, any> = {}) {
  return {
    id: UUID1,
    created_at: '2026-01-01',
    name: 'Test League',
    city_id: UUID_CITY,
    start_date: '2026-04-01',
    end_date: '2026-12-01',
    max_players: 16,
    min_rating: null,
    max_rating: null,
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
    match_format: { number_of_sets: 3 },
    organization_id: null,
    active_player_count: 5,
    organizations: null,
    ...overrides,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('League Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableLeagues', () => {
    it('returns leagues filtered by city', async () => {
      const { getAvailableLeagues } = await import('@/lib/actions/leagues.actions')

      const leaguesBuilder = createQueryBuilder({
        data: [makeRawLeague()],
        error: null,
      })
      mockFrom.mockReturnValue(leaguesBuilder)
      mockGetUser.mockResolvedValue({ data: { user: { id: UUID_USER } } })

      const result = await getAvailableLeagues(UUID_CITY)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].name).toBe('Test League')
      expect(result.data![0].player_count).toBe(5)
    })

    it('filters out club-only leagues when player has no club', async () => {
      const { getAvailableLeagues } = await import('@/lib/actions/leagues.actions')

      const leaguesBuilder = createQueryBuilder({
        data: [makeRawLeague({ organization_id: UUID_ORG, organizations: { name: 'Club' } })],
        error: null,
      })
      mockFrom.mockReturnValue(leaguesBuilder)
      mockGetUser.mockResolvedValue({ data: { user: { id: UUID_USER } } })

      const result = await getAvailableLeagues(UUID_CITY, null)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(0)
    })

    it('shows club-only leagues when player belongs to that club', async () => {
      const { getAvailableLeagues } = await import('@/lib/actions/leagues.actions')

      const leaguesBuilder = createQueryBuilder({
        data: [makeRawLeague({ organization_id: UUID_ORG, organizations: { name: 'Club' } })],
        error: null,
      })
      mockFrom.mockReturnValue(leaguesBuilder)
      mockGetUser.mockResolvedValue({ data: { user: { id: UUID_USER } } })

      const result = await getAvailableLeagues(UUID_CITY, UUID_ORG)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
    })

    it('returns error when supabase query fails', async () => {
      const { getAvailableLeagues } = await import('@/lib/actions/leagues.actions')

      const leaguesBuilder = createQueryBuilder({
        data: null,
        error: { message: 'Connection failed' },
      })
      mockFrom.mockReturnValue(leaguesBuilder)

      const result = await getAvailableLeagues(UUID_CITY)

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  describe('joinLeague', () => {
    it('blocks joining when player has retired from league', async () => {
      const { joinLeague } = await import('@/lib/actions/leagues.actions')

      const membershipBuilder = createQueryBuilder({
        data: { id: UUID1, status: 'retired' },
        error: null,
      })
      mockFrom.mockReturnValue(membershipBuilder)

      const result = await joinLeague(UUID1, UUID2)

      expect(result.error).toBeTruthy()
      expect(result.error!.message).toContain('retired')
    })

    it('blocks joining when already a member', async () => {
      const { joinLeague } = await import('@/lib/actions/leagues.actions')

      const membershipBuilder = createQueryBuilder({
        data: { id: UUID1, status: 'active' },
        error: null,
      })
      mockFrom.mockReturnValue(membershipBuilder)

      const result = await joinLeague(UUID1, UUID2)

      expect(result.error).toBeTruthy()
      expect(result.error!.message).toContain('Already a member')
    })

    it('blocks joining a doubles league as singles', async () => {
      const { joinLeague } = await import('@/lib/actions/leagues.actions')

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createQueryBuilder({ data: null, error: null })
        }
        if (callCount === 2) {
          return createQueryBuilder({
            data: {
              max_players: 16,
              competition_type: 'round_robin',
              participant_type: 'doubles',
              start_date: '2027-01-01',
            },
            error: null,
          })
        }
        if (callCount === 3) {
          return createQueryBuilder({ data: null, error: null, count: 0 })
        }
        return createQueryBuilder({ data: null, error: null })
      })

      const result = await joinLeague(UUID1, UUID2)

      expect(result.error).toBeTruthy()
      expect(result.error!.message).toContain('doubles')
    })

    it('blocks joining a full league', async () => {
      const { joinLeague } = await import('@/lib/actions/leagues.actions')

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createQueryBuilder({ data: null, error: null })
        }
        if (callCount === 2) {
          return createQueryBuilder({
            data: {
              max_players: 8,
              competition_type: 'round_robin',
              participant_type: 'singles',
              start_date: '2027-01-01',
            },
            error: null,
          })
        }
        if (callCount === 3) {
          return createQueryBuilder({ data: null, error: null, count: 8 })
        }
        return createQueryBuilder({ data: null, error: null })
      })

      const result = await joinLeague(UUID1, UUID2)

      expect(result.error).toBeTruthy()
      expect(result.error!.message).toContain('full')
    })

    it('blocks joining a league that has already started', async () => {
      const { joinLeague } = await import('@/lib/actions/leagues.actions')

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createQueryBuilder({ data: null, error: null })
        }
        if (callCount === 2) {
          return createQueryBuilder({
            data: {
              max_players: 16,
              competition_type: 'round_robin',
              participant_type: 'singles',
              start_date: '2020-01-01',
            },
            error: null,
          })
        }
        return createQueryBuilder({ data: null, error: null })
      })

      const result = await joinLeague(UUID1, UUID2)

      expect(result.error).toBeTruthy()
      expect(result.error!.message).toContain('already started')
    })
  })

  describe('getLeagueStandings', () => {
    it('formats player names as "First L."', async () => {
      const { getLeagueStandings } = await import('@/lib/actions/leagues.actions')

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createQueryBuilder({
            data: { competition_type: 'round_robin' },
            error: null,
          })
        }
        if (callCount === 2) {
          return createQueryBuilder({
            data: [
              {
                player_id: UUID1,
                points: 9,
                matches_played: 3,
                wins: 3,
                losses: 0,
                player: {
                  first_name: 'Roberto',
                  last_name: 'Iglesias',
                  rating: 3.5,
                  nationality_code: 'AR',
                  is_active: true,
                },
              },
              {
                player_id: UUID2,
                points: 6,
                matches_played: 3,
                wins: 2,
                losses: 1,
                player: {
                  first_name: 'Carlos',
                  last_name: 'Garcia',
                  rating: 4.0,
                  nationality_code: 'ES',
                  is_active: true,
                },
              },
            ],
            error: null,
          })
        }
        return createQueryBuilder({ data: null, error: null })
      })

      const result = await getLeagueStandings(UUID1)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(2)
      expect(result.data![0].player_name).toBe('Roberto I.')
      expect(result.data![1].player_name).toBe('Carlos G.')
      expect(result.data![0].position).toBe(1)
      expect(result.data![1].position).toBe(2)
    })

    it('filters out inactive players', async () => {
      const { getLeagueStandings } = await import('@/lib/actions/leagues.actions')

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return createQueryBuilder({
            data: { competition_type: 'round_robin' },
            error: null,
          })
        }
        if (callCount === 2) {
          return createQueryBuilder({
            data: [
              {
                player_id: UUID1,
                points: 9,
                matches_played: 3,
                wins: 3,
                losses: 0,
                player: {
                  first_name: 'Active',
                  last_name: 'Player',
                  rating: 3.5,
                  nationality_code: null,
                  is_active: true,
                },
              },
              {
                player_id: UUID2,
                points: 6,
                matches_played: 3,
                wins: 2,
                losses: 1,
                player: {
                  first_name: 'Inactive',
                  last_name: 'Player',
                  rating: 3.0,
                  nationality_code: null,
                  is_active: false,
                },
              },
            ],
            error: null,
          })
        }
        return createQueryBuilder({ data: null, error: null })
      })

      const result = await getLeagueStandings(UUID1)

      expect(result.data).toHaveLength(1)
      expect(result.data![0].player_name).toBe('Active P.')
    })
  })

  describe('getMultipleLeagueStandings', () => {
    it('returns empty object for empty input', async () => {
      const { getMultipleLeagueStandings } = await import('@/lib/actions/leagues.actions')

      const result = await getMultipleLeagueStandings([])

      expect(result.data).toEqual({})
      expect(result.error).toBeNull()
    })

    it('groups standings by league_id with correct positions', async () => {
      const { getMultipleLeagueStandings } = await import('@/lib/actions/leagues.actions')

      mockFrom.mockReturnValue(
        createQueryBuilder({
          data: [
            {
              league_id: UUID1,
              player_id: UUID2,
              points: 9,
              matches_played: 3,
              wins: 3,
              losses: 0,
              player: { first_name: 'Alice', last_name: 'Smith', rating: 4.0, nationality_code: 'US', is_active: true },
            },
            {
              league_id: UUID1,
              player_id: UUID3,
              points: 3,
              matches_played: 3,
              wins: 1,
              losses: 2,
              player: { first_name: 'Bob', last_name: 'Jones', rating: 3.5, nationality_code: 'US', is_active: true },
            },
            {
              league_id: UUID_CITY,
              player_id: UUID_USER,
              points: 6,
              matches_played: 2,
              wins: 2,
              losses: 0,
              player: { first_name: 'Carlos', last_name: 'Diaz', rating: 4.5, nationality_code: 'MX', is_active: true },
            },
          ],
          error: null,
        })
      )

      const result = await getMultipleLeagueStandings([UUID1, UUID_CITY])

      expect(result.error).toBeNull()
      expect(Object.keys(result.data!)).toHaveLength(2)
      expect(result.data![UUID1]).toHaveLength(2)
      expect(result.data![UUID_CITY]).toHaveLength(1)
      expect(result.data![UUID1][0].position).toBe(1)
      expect(result.data![UUID1][0].player_name).toBe('Alice S.')
      expect(result.data![UUID1][1].position).toBe(2)
      expect(result.data![UUID_CITY][0].position).toBe(1)
    })
  })
})
