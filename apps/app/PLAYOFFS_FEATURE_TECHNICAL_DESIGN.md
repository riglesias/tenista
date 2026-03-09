# Playoffs Feature Technical Design Document

**Author**: Senior Staff Engineer Review  
**Date**: July 2025  
**Status**: Technical Design Review  

## Executive Summary

This document outlines the technical design for implementing a comprehensive playoffs feature in the Tenista tennis league management application. The feature enables tournament-style elimination brackets for league competitions, with automatic qualification based on regular season standings.

## Business Requirements

- **Primary Goal**: Add playoff tournaments to existing league system
- **Key Features**:
  - Toggle-based playoff enablement per league (`hasPlayoffs` flag)
  - Automatic player qualification based on league standings
  - Tournament bracket generation with proper seeding
  - Bye handling for non-power-of-2 player counts
  - Integration with existing match result system

## Technical Architecture

### Database Schema Design

#### 1. **leagues table** (Modification)
```sql
ALTER TABLE leagues ADD COLUMN has_playoffs boolean DEFAULT false;
```

**Rationale**: Extends existing table rather than creating new relationships, maintaining backward compatibility.

#### 2. **playoff_tournaments table** (New)
```sql
CREATE TABLE playoff_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' 
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  total_rounds integer NOT NULL CHECK (total_rounds > 0),
  qualifying_players_count integer NOT NULL CHECK (qualifying_players_count > 0),
  bracket_data jsonb, -- Denormalized bracket structure for performance
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(league_id) -- One playoff tournament per league
);
```

**Design Decisions**:
- **JSONB bracket_data**: Stores denormalized bracket structure for fast UI rendering
- **Unique constraint**: Ensures one playoff tournament per league
- **Check constraints**: Prevents invalid data states
- **Cascade deletion**: Maintains referential integrity

#### 3. **playoff_participants table** (New)
```sql
CREATE TABLE playoff_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playoff_tournament_id uuid NOT NULL REFERENCES playoff_tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed_position integer NOT NULL CHECK (seed_position > 0),
  league_position integer NOT NULL CHECK (league_position > 0),
  league_points integer NOT NULL CHECK (league_points >= 0),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(playoff_tournament_id, player_id),
  UNIQUE(playoff_tournament_id, seed_position)
);
```

**Design Decisions**:
- **Dual uniqueness**: Prevents duplicate players and seed positions
- **Snapshot data**: Captures league standings at playoff creation time
- **Immutable seeding**: Seed positions remain fixed once set

#### 4. **playoff_rounds table** (New)
```sql
CREATE TABLE playoff_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playoff_tournament_id uuid NOT NULL REFERENCES playoff_tournaments(id) ON DELETE CASCADE,
  round_number integer NOT NULL CHECK (round_number > 0),
  round_name text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' 
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(playoff_tournament_id, round_number)
);
```

#### 5. **playoff_matches table** (New)
```sql
CREATE TABLE playoff_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playoff_round_id uuid NOT NULL REFERENCES playoff_rounds(id) ON DELETE CASCADE,
  match_number integer NOT NULL CHECK (match_number > 0),
  player1_id uuid REFERENCES players(id),
  player2_id uuid REFERENCES players(id),
  winner_id uuid REFERENCES players(id),
  player_match_id uuid REFERENCES player_matches(id), -- Links to actual match
  is_bye boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'bye')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(playoff_round_id, match_number),
  CHECK (
    (is_bye = true AND player2_id IS NULL AND winner_id = player1_id) OR
    (is_bye = false AND player1_id IS NOT NULL AND player2_id IS NOT NULL)
  )
);
```

**Design Decisions**:
- **Flexible player references**: Allows NULL for bye scenarios
- **Check constraints**: Enforces bye logic consistency
- **player_match_id**: Links to existing match system for result storage

### Core Algorithms

#### 1. **Bracket Generation Algorithm**
```typescript
interface BracketGenerationOptions {
  players: QualifiedPlayer[];
  tournamentSize: number; // Next power of 2
}

function generateBracket(options: BracketGenerationOptions): BracketStructure {
  const { players, tournamentSize } = options;
  const byeCount = tournamentSize - players.length;
  
  // Distribute byes evenly across top and bottom of bracket
  const topByes = Math.ceil(byeCount / 2);
  const bottomByes = Math.floor(byeCount / 2);
  
  // Seed-based pairing: 1 vs N, 2 vs N-1, etc.
  return createSeededBracket(players, topByes, bottomByes);
}
```

#### 2. **Qualification Logic**
```typescript
interface QualificationCriteria {
  leagueId: string;
  qualifyingCount: number; // Top N players
  endDate: Date;
}

function getQualifyingPlayers(criteria: QualificationCriteria): QualifiedPlayer[] {
  // Query league standings at league end date
  // Apply qualification rules (minimum matches played, etc.)
  // Return top N players by points/ranking
}
```

### TypeScript Type Definitions

```typescript
// Database types extension
interface Database {
  public: {
    Tables: {
      leagues: {
        Row: {
          // ... existing fields
          has_playoffs: boolean | null;
        };
      };
      playoff_tournaments: {
        Row: {
          id: string;
          league_id: string;
          status: 'not_started' | 'in_progress' | 'completed';
          total_rounds: number;
          qualifying_players_count: number;
          bracket_data: BracketData | null;
          created_at: string;
          updated_at: string;
        };
      };
      // ... other new tables
    };
  };
}

// Business logic types
interface BracketData {
  rounds: BracketRound[];
  totalRounds: number;
  participantCount: number;
}

interface BracketRound {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
}

interface BracketMatch {
  matchNumber: number;
  player1: QualifiedPlayer | null;
  player2: QualifiedPlayer | null;
  winner: QualifiedPlayer | null;
  isBye: boolean;
  status: 'pending' | 'completed' | 'bye';
}
```

### Zod Validation Schemas

```typescript
// Extended league schema
export const LeagueSchema = z.object({
  // ... existing fields
  has_playoffs: z.boolean().nullable(),
});

// New playoff schemas
export const PlayoffTournamentSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  total_rounds: z.number().int().positive(),
  qualifying_players_count: z.number().int().positive(),
  bracket_data: z.object({
    rounds: z.array(z.object({
      roundNumber: z.number().int().positive(),
      roundName: z.string(),
      matches: z.array(z.object({
        matchNumber: z.number().int().positive(),
        player1: z.object({}).nullable(),
        player2: z.object({}).nullable(),
        winner: z.object({}).nullable(),
        isBye: z.boolean(),
        status: z.enum(['pending', 'completed', 'bye']),
      })),
    })),
  }).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
```

## Implementation Plan

### Phase 1: Database Foundation (Days 1-2)
**Priority**: Critical  
**Effort**: 2 days  

**Tasks**:
1. Create Supabase migration for new tables
2. Add RLS policies for all new tables
3. Generate TypeScript types from schema
4. Create initial Zod validation schemas
5. Write database action functions

**Deliverables**:
- Migration files
- Updated database types
- Basic CRUD operations
- Unit tests for database functions

### Phase 2: Core Business Logic (Days 3-4)
**Priority**: Critical  
**Effort**: 2 days  

**Tasks**:
1. Implement bracket generation algorithm
2. Create qualification logic
3. Build tournament progression system
4. Integrate with existing match system
5. Handle edge cases (ties, withdrawals)

**Deliverables**:
- Bracket generation service
- Tournament management service
- Integration with player_matches
- Comprehensive test suite

### Phase 3: API Layer (Day 5)
**Priority**: High  
**Effort**: 1 day  

**Tasks**:
1. Create server actions for playoff operations
2. Implement tournament creation workflow
3. Add match result handling for playoffs
4. Create data fetching hooks

**Deliverables**:
- Server actions in `lib/actions/playoffs.ts`
- React hooks for playoff data
- Error handling and validation
- API integration tests

### Phase 4: UI Implementation (Days 6-8)
**Priority**: High  
**Effort**: 3 days  

**Tasks**:
1. Add playoffs tab to league page
2. Create bracket visualization component
3. Build qualifying players display
4. Implement match result submission for playoffs
5. Add tournament status indicators

**Deliverables**:
- Playoffs tab component
- Interactive bracket component
- Responsive design for mobile/web
- User acceptance tests

### Phase 5: Testing & Polish (Days 9-10)
**Priority**: Medium  
**Effort**: 2 days  

**Tasks**:
1. End-to-end testing scenarios
2. Performance optimization
3. Error handling improvements
4. Documentation updates
5. Code review and refactoring

**Deliverables**:
- E2E test suite
- Performance benchmarks
- Updated documentation
- Production-ready code

## Technical Considerations

### Performance Optimizations
- **JSONB bracket_data**: Denormalized storage for fast bracket rendering
- **Indexed queries**: Add indexes on frequently queried columns
- **Caching strategy**: Cache bracket data for active tournaments
- **Lazy loading**: Load bracket data only when playoffs tab is accessed

### Security Considerations
- **RLS policies**: Restrict access to playoff data based on league membership
- **Input validation**: Validate all playoff-related inputs
- **Authorization**: Ensure only league organizers can manage playoffs
- **Data integrity**: Prevent manipulation of tournament results

### Scalability Considerations
- **Database partitioning**: Consider partitioning by league for large datasets
- **Background jobs**: Handle tournament creation and bracket generation asynchronously
- **Rate limiting**: Prevent rapid tournament creation/modification
- **Monitoring**: Add observability for playoff-related operations

### Edge Cases & Error Handling
- **Tie resolution**: Handle tied standings in qualification
- **Player withdrawal**: Manage player withdrawals mid-tournament
- **Match disputes**: Integration with existing dispute resolution
- **League modifications**: Prevent league changes during active playoffs
- **Data corruption**: Recovery procedures for corrupted bracket data

## Migration Strategy

### Backward Compatibility
- **Default values**: `has_playoffs` defaults to `false`
- **Existing leagues**: No impact on current functionality
- **Gradual rollout**: Feature can be enabled per league

### Rollback Plan
- **Database rollback**: Prepared migration rollback scripts
- **Feature flags**: Ability to disable playoffs feature
- **Data preservation**: Maintain existing league functionality

## Success Metrics

### Technical Metrics
- **Database performance**: Query response times < 100ms
- **UI responsiveness**: Bracket rendering < 500ms
- **Error rates**: < 0.1% for playoff operations
- **Test coverage**: > 90% for playoff-related code

### Business Metrics
- **Feature adoption**: % of leagues enabling playoffs
- **User engagement**: Time spent on playoffs tab
- **Match completion**: % of playoff matches completed
- **User satisfaction**: Feedback scores for playoff experience

## Risk Assessment

### High Risk
- **Bracket complexity**: Algorithm bugs affecting tournament integrity
- **Data consistency**: Race conditions in tournament progression
- **Performance impact**: Slow bracket rendering for large tournaments

### Medium Risk
- **User experience**: Confusing bracket visualization
- **Integration issues**: Conflicts with existing match system
- **Edge case handling**: Unexpected tournament states

### Low Risk
- **Schema changes**: Well-defined database migrations
- **Backward compatibility**: Isolated feature with defaults
- **Testing coverage**: Comprehensive test suite

## Conclusion

The playoffs feature represents a significant enhancement to the Tenista application, requiring careful attention to database design, algorithm implementation, and user experience. The proposed architecture provides a solid foundation for tournament management while maintaining system performance and data integrity.

The phased implementation approach allows for iterative development and testing, reducing risk while delivering value incrementally. The technical design addresses key scalability and performance concerns while providing a robust foundation for future enhancements.

**Recommendation**: Proceed with implementation following the outlined phases and technical specifications.