import { z } from 'zod';

// Doubles team schema
export const DoublesTeamSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  player1_id: z.string().uuid(),
  player2_id: z.string().uuid(),
  team_name: z.string().nullable(),
  combined_rating: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DoublesTeam = z.infer<typeof DoublesTeamSchema>;

// Doubles team with player info (for display)
export const DoublesTeamWithPlayersSchema = DoublesTeamSchema.extend({
  player1: z.object({
    id: z.string().uuid(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    rating: z.number().nullable(),
    nationality_code: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }),
  player2: z.object({
    id: z.string().uuid(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    rating: z.number().nullable(),
    nationality_code: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }),
});
export type DoublesTeamWithPlayers = z.infer<typeof DoublesTeamWithPlayersSchema>;
export const DoublesTeamsWithPlayersSchema = z.array(DoublesTeamWithPlayersSchema);

// Create doubles team input schema
export const CreateDoublesTeamInputSchema = z.object({
  league_id: z.string().uuid(),
  partner_id: z.string().uuid(),
  team_name: z.string().min(1).max(50).optional(),
}).refine(
  (data) => data.partner_id !== undefined,
  { message: 'Partner ID is required' }
);
export type CreateDoublesTeamInput = z.infer<typeof CreateDoublesTeamInputSchema>;

// Update doubles team input schema
export const UpdateDoublesTeamInputSchema = z.object({
  team_name: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});
export type UpdateDoublesTeamInput = z.infer<typeof UpdateDoublesTeamInputSchema>;

// Raw doubles team data from Supabase query
export const RawDoublesTeamSchema = z.object({
  id: z.string().uuid(),
  league_id: z.string().uuid(),
  player1_id: z.string().uuid(),
  player2_id: z.string().uuid(),
  team_name: z.string().nullable(),
  combined_rating: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  player1: z.object({
    id: z.string().uuid(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    rating: z.number().nullable(),
    nationality_code: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }).nullable(),
  player2: z.object({
    id: z.string().uuid(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    rating: z.number().nullable(),
    nationality_code: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }).nullable(),
});
export const RawDoublesTeamsSchema = z.array(RawDoublesTeamSchema);

// Helper function to format doubles team display name
export function formatDoublesTeamName(team: DoublesTeamWithPlayers): string {
  if (team.team_name) {
    return team.team_name;
  }

  const player1Name = formatPlayerName(team.player1.first_name, team.player1.last_name);
  const player2Name = formatPlayerName(team.player2.first_name, team.player2.last_name);

  return `${player1Name} & ${player2Name}`;
}

// Helper function to format player name
function formatPlayerName(firstName: string | null, lastName: string | null): string {
  if (!firstName && !lastName) return 'Unknown';
  if (!lastName) return firstName || 'Unknown';
  if (!firstName) return lastName;
  return `${firstName} ${lastName.charAt(0)}.`;
}

// Helper function to calculate combined rating for a doubles team
export function calculateCombinedRating(
  player1Rating: number | null,
  player2Rating: number | null
): number | null {
  if (player1Rating === null && player2Rating === null) {
    return null;
  }

  const rating1 = player1Rating ?? 0;
  const rating2 = player2Rating ?? 0;

  // Average of both players' ratings
  return (rating1 + rating2) / 2;
}

// Helper function to ensure player order (player1_id < player2_id)
export function orderPlayerIds(
  playerId1: string,
  playerId2: string
): { player1_id: string; player2_id: string } {
  if (playerId1 < playerId2) {
    return { player1_id: playerId1, player2_id: playerId2 };
  }
  return { player1_id: playerId2, player2_id: playerId1 };
}
