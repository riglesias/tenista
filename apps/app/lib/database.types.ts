export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bracket_seeds: {
        Row: {
          created_at: string | null
          id: string
          is_bye: boolean
          player_id: string | null
          seed_number: number
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_bye?: boolean
          player_id?: string | null
          seed_number: number
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_bye?: boolean
          player_id?: string | null
          seed_number?: number
          tournament_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_seeds_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_seeds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          player_count: number | null
          state_province: string | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          player_count?: number | null
          state_province?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          player_count?: number | null
          state_province?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      courts: {
        Row: {
          address: string | null
          amenities: string[] | null
          city_id: string
          contact_info: Json | null
          court_type: string | null
          created_at: string | null
          has_lights: boolean | null
          id: string
          is_public: boolean | null
          name: string
          number_of_courts: number | null
          surface_type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          city_id: string
          contact_info?: Json | null
          court_type?: string | null
          created_at?: string | null
          has_lights?: boolean | null
          id?: string
          is_public?: boolean | null
          name: string
          number_of_courts?: number | null
          surface_type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          city_id?: string
          contact_info?: Json | null
          court_type?: string | null
          created_at?: string | null
          has_lights?: boolean | null
          id?: string
          is_public?: boolean | null
          name?: string
          number_of_courts?: number | null
          surface_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      integrity_check_log: {
        Row: {
          check_time: string | null
          critical_issues: number | null
          id: string
          issues_detail: Json | null
          issues_found: number | null
          status: string | null
          total_leagues: number | null
          total_players: number | null
        }
        Insert: {
          check_time?: string | null
          critical_issues?: number | null
          id?: string
          issues_detail?: Json | null
          issues_found?: number | null
          status?: string | null
          total_leagues?: number | null
          total_players?: number | null
        }
        Update: {
          check_time?: string | null
          critical_issues?: number | null
          id?: string
          issues_detail?: Json | null
          issues_found?: number | null
          status?: string | null
          total_leagues?: number | null
          total_players?: number | null
        }
        Relationships: []
      }
      league_matches: {
        Row: {
          created_at: string | null
          created_by: string | null
          game_type: string | null
          id: string
          league_id: string | null
          match_type: string | null
          number_of_sets: number | null
          played_at: string | null
          player1_id: string
          player2_id: string
          points_loser: number | null
          points_winner: number | null
          score: Json | null
          status: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          game_type?: string | null
          id?: string
          league_id?: string | null
          match_type?: string | null
          number_of_sets?: number | null
          played_at?: string | null
          player1_id: string
          player2_id: string
          points_loser?: number | null
          points_winner?: number | null
          score?: Json | null
          status?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          game_type?: string | null
          id?: string
          league_id?: string | null
          match_type?: string | null
          number_of_sets?: number | null
          played_at?: string | null
          player1_id?: string
          player2_id?: string
          points_loser?: number | null
          points_winner?: number | null
          score?: Json | null
          status?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_matches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      league_players: {
        Row: {
          doubles_team_id: string | null
          id: string
          ladder_position: number | null
          last_match_date: string | null
          league_id: string | null
          losses: number | null
          matches_played: number | null
          player_id: string | null
          points: number | null
          wins: number | null
        }
        Insert: {
          doubles_team_id?: string | null
          id?: string
          ladder_position?: number | null
          last_match_date?: string | null
          league_id?: string | null
          losses?: number | null
          matches_played?: number | null
          player_id?: string | null
          points?: number | null
          wins?: number | null
        }
        Update: {
          doubles_team_id?: string | null
          id?: string
          ladder_position?: number | null
          last_match_date?: string | null
          league_id?: string | null
          losses?: number | null
          matches_played?: number | null
          player_id?: string | null
          points?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "league_players_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          category: Json | null
          city_id: string | null
          competition_type: string | null
          created_at: string | null
          default_points_loss: number | null
          default_points_win: number | null
          division: string | null
          end_date: string
          has_playoffs: boolean | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          is_private: boolean | null
          ladder_config: Json | null
          location: string | null
          max_players: number
          max_rating: number | null
          min_rating: number | null
          name: string
          organizer_id: string
          participant_type: string | null
          price_cents: number | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          category?: Json | null
          city_id?: string | null
          competition_type?: string | null
          created_at?: string | null
          default_points_loss?: number | null
          default_points_win?: number | null
          division?: string | null
          end_date: string
          has_playoffs?: boolean | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          is_private?: boolean | null
          ladder_config?: Json | null
          location?: string | null
          max_players: number
          max_rating?: number | null
          min_rating?: number | null
          name: string
          organizer_id: string
          participant_type?: string | null
          price_cents?: number | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          category?: Json | null
          city_id?: string | null
          competition_type?: string | null
          created_at?: string | null
          default_points_loss?: number | null
          default_points_win?: number | null
          division?: string | null
          end_date?: string
          has_playoffs?: boolean | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          is_private?: boolean | null
          ladder_config?: Json | null
          location?: string | null
          max_players?: number
          max_rating?: number | null
          min_rating?: number | null
          name?: string
          organizer_id?: string
          participant_type?: string | null
          price_cents?: number | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          bracket_section: string
          created_at: string | null
          id: string
          is_auto_advanced: boolean
          match_number_in_round: number
          player_a_id: string | null
          player_b_id: string | null
          round_number: number
          scores: string | null
          source_match_id: string | null
          status: string
          tournament_id: string
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          bracket_section?: string
          created_at?: string | null
          id?: string
          is_auto_advanced?: boolean
          match_number_in_round: number
          player_a_id?: string | null
          player_b_id?: string | null
          round_number: number
          scores?: string | null
          source_match_id?: string | null
          status?: string
          tournament_id: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          bracket_section?: string
          created_at?: string | null
          id?: string
          is_auto_advanced?: boolean
          match_number_in_round?: number
          player_a_id?: string | null
          player_b_id?: string | null
          round_number?: number
          scores?: string | null
          source_match_id?: string | null
          status?: string
          tournament_id?: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player_a_id_fkey"
            columns: ["player_a_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player_b_id_fkey"
            columns: ["player_b_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          added_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          added_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_players: {
        Row: {
          added_at: string
          organization_id: string
          player_id: string
        }
        Insert: {
          added_at?: string
          organization_id: string
          player_id: string
        }
        Update: {
          added_at?: string
          organization_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_players_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          court_id: string | null
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          court_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          court_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_matches: {
        Row: {
          competition_type: string | null
          created_at: string | null
          game_type: string
          id: string
          is_verified: boolean | null
          ladder_challenge_id: string | null
          league_id: string | null
          match_date: string
          match_type: string | null
          number_of_sets: number | null
          player1_id: string | null
          player2_id: string | null
          playoff_tournament_id: string | null
          scores: Json
          submitted_by: string
          team1_id: string | null
          team2_id: string | null
          updated_at: string | null
          winner_id: string | null
          winner_team_id: string | null
        }
        Insert: {
          competition_type?: string | null
          created_at?: string | null
          game_type: string
          id?: string
          is_verified?: boolean | null
          ladder_challenge_id?: string | null
          league_id?: string | null
          match_date: string
          match_type?: string | null
          number_of_sets?: number | null
          player1_id?: string | null
          player2_id?: string | null
          playoff_tournament_id?: string | null
          scores: Json
          submitted_by: string
          team1_id?: string | null
          team2_id?: string | null
          updated_at?: string | null
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Update: {
          competition_type?: string | null
          created_at?: string | null
          game_type?: string
          id?: string
          is_verified?: boolean | null
          ladder_challenge_id?: string | null
          league_id?: string | null
          match_date?: string
          match_type?: string | null
          number_of_sets?: number | null
          player1_id?: string | null
          player2_id?: string | null
          playoff_tournament_id?: string | null
          scores?: Json
          submitted_by?: string
          team1_id?: string | null
          team2_id?: string | null
          updated_at?: string | null
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_matches_playoff_tournament_id_fkey"
            columns: ["playoff_tournament_id"]
            isOneToOne: false
            referencedRelation: "playoff_tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_matches_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      doubles_teams: {
        Row: {
          id: string
          league_id: string
          player1_id: string
          player2_id: string
          team_name: string | null
          combined_rating: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          player1_id: string
          player2_id: string
          team_name?: string | null
          combined_rating?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          player1_id?: string
          player2_id?: string
          team_name?: string | null
          combined_rating?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubles_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doubles_teams_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doubles_teams_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      ladder_rankings: {
        Row: {
          id: string
          league_id: string
          player_id: string | null
          doubles_team_id: string | null
          position: number
          previous_position: number | null
          last_match_date: string | null
          last_activity_check: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          player_id?: string | null
          doubles_team_id?: string | null
          position: number
          previous_position?: number | null
          last_match_date?: string | null
          last_activity_check?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          player_id?: string | null
          doubles_team_id?: string | null
          position?: number
          previous_position?: number | null
          last_match_date?: string | null
          last_activity_check?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ladder_rankings_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_rankings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_rankings_doubles_team_id_fkey"
            columns: ["doubles_team_id"]
            isOneToOne: false
            referencedRelation: "doubles_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ladder_challenges: {
        Row: {
          id: string
          league_id: string
          challenger_player_id: string | null
          challenger_team_id: string | null
          challenger_position: number
          challenged_player_id: string | null
          challenged_team_id: string | null
          challenged_position: number
          status: string
          acceptance_deadline: string
          match_deadline: string | null
          player_match_id: string | null
          winner_player_id: string | null
          winner_team_id: string | null
          new_challenger_position: number | null
          new_challenged_position: number | null
          created_at: string
          accepted_at: string | null
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          challenger_player_id?: string | null
          challenger_team_id?: string | null
          challenger_position: number
          challenged_player_id?: string | null
          challenged_team_id?: string | null
          challenged_position: number
          status?: string
          acceptance_deadline: string
          match_deadline?: string | null
          player_match_id?: string | null
          winner_player_id?: string | null
          winner_team_id?: string | null
          new_challenger_position?: number | null
          new_challenged_position?: number | null
          created_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          challenger_player_id?: string | null
          challenger_team_id?: string | null
          challenger_position?: number
          challenged_player_id?: string | null
          challenged_team_id?: string | null
          challenged_position?: number
          status?: string
          acceptance_deadline?: string
          match_deadline?: string | null
          player_match_id?: string | null
          winner_player_id?: string | null
          winner_team_id?: string | null
          new_challenger_position?: number | null
          new_challenged_position?: number | null
          created_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ladder_challenges_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_challenges_challenger_player_id_fkey"
            columns: ["challenger_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_challenges_challenged_player_id_fkey"
            columns: ["challenged_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_challenges_player_match_id_fkey"
            columns: ["player_match_id"]
            isOneToOne: false
            referencedRelation: "player_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      ladder_position_history: {
        Row: {
          id: string
          league_id: string
          player_id: string | null
          doubles_team_id: string | null
          old_position: number
          new_position: number
          change_reason: string
          challenge_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          player_id?: string | null
          doubles_team_id?: string | null
          old_position: number
          new_position: number
          change_reason: string
          challenge_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          player_id?: string | null
          doubles_team_id?: string | null
          old_position?: number
          new_position?: number
          change_reason?: string
          challenge_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ladder_position_history_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_position_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ladder_position_history_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "ladder_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          auth_user_id: string | null
          availability: Json | null
          available_today: boolean | null
          available_today_updated_at: string | null
          avatar_url: string | null
          city_id: string | null
          city_name: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          first_name: string | null
          gender: string | null
          homecourt_id: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          nationality_code: string | null
          nationality_name: string | null
          onboarding_completed: boolean | null
          phone_country_code: string | null
          phone_number: string | null
          rating: number | null
          state_province: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          availability?: Json | null
          available_today?: boolean | null
          available_today_updated_at?: string | null
          avatar_url?: string | null
          city_id?: string | null
          city_name?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          first_name?: string | null
          gender?: string | null
          homecourt_id?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          nationality_code?: string | null
          nationality_name?: string | null
          onboarding_completed?: boolean | null
          phone_country_code?: string | null
          phone_number?: string | null
          rating?: number | null
          state_province?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          availability?: Json | null
          available_today?: boolean | null
          available_today_updated_at?: string | null
          avatar_url?: string | null
          city_id?: string | null
          city_name?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          first_name?: string | null
          gender?: string | null
          homecourt_id?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          nationality_code?: string | null
          nationality_name?: string | null
          onboarding_completed?: boolean | null
          phone_country_code?: string | null
          phone_number?: string | null
          rating?: number | null
          state_province?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_homecourt_id_fkey"
            columns: ["homecourt_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      playoff_matches: {
        Row: {
          bracket_section: string
          created_at: string | null
          id: string
          is_bye: boolean | null
          match_number: number
          player_match_id: string | null
          player1_id: string | null
          player2_id: string | null
          playoff_round_id: string
          source_match_id: string | null
          status: string
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          bracket_section?: string
          created_at?: string | null
          id?: string
          is_bye?: boolean | null
          match_number: number
          player_match_id?: string | null
          player1_id?: string | null
          player2_id?: string | null
          playoff_round_id: string
          source_match_id?: string | null
          status?: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          bracket_section?: string
          created_at?: string | null
          id?: string
          is_bye?: boolean | null
          match_number?: number
          player_match_id?: string | null
          player1_id?: string | null
          player2_id?: string | null
          playoff_round_id?: string
          source_match_id?: string | null
          status?: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playoff_matches_player_match_id_fkey"
            columns: ["player_match_id"]
            isOneToOne: false
            referencedRelation: "player_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_playoff_round_id_fkey"
            columns: ["playoff_round_id"]
            isOneToOne: false
            referencedRelation: "playoff_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      playoff_participants: {
        Row: {
          created_at: string | null
          current_section: string | null
          id: string
          league_points: number
          league_position: number
          matches_played: number
          player_id: string
          playoff_tournament_id: string
          seed_position: number
        }
        Insert: {
          created_at?: string | null
          current_section?: string | null
          id?: string
          league_points: number
          league_position: number
          matches_played?: number
          player_id: string
          playoff_tournament_id: string
          seed_position: number
        }
        Update: {
          created_at?: string | null
          current_section?: string | null
          id?: string
          league_points?: number
          league_position?: number
          matches_played?: number
          player_id?: string
          playoff_tournament_id?: string
          seed_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "playoff_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_participants_playoff_tournament_id_fkey"
            columns: ["playoff_tournament_id"]
            isOneToOne: false
            referencedRelation: "playoff_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      playoff_rounds: {
        Row: {
          bracket_section: string
          created_at: string | null
          id: string
          playoff_tournament_id: string
          round_name: string
          round_number: number
          status: string
          updated_at: string | null
        }
        Insert: {
          bracket_section?: string
          created_at?: string | null
          id?: string
          playoff_tournament_id: string
          round_name: string
          round_number: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          bracket_section?: string
          created_at?: string | null
          id?: string
          playoff_tournament_id?: string
          round_name?: string
          round_number?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playoff_rounds_playoff_tournament_id_fkey"
            columns: ["playoff_tournament_id"]
            isOneToOne: false
            referencedRelation: "playoff_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      playoff_tournaments: {
        Row: {
          bracket_data: Json | null
          bracket_type: string
          created_at: string | null
          id: string
          league_id: string
          qualifying_players_count: number
          start_date: string
          status: string
          total_rounds: number
          updated_at: string | null
        }
        Insert: {
          bracket_data?: Json | null
          bracket_type?: string
          created_at?: string | null
          id?: string
          league_id: string
          qualifying_players_count: number
          start_date: string
          status?: string
          total_rounds: number
          updated_at?: string | null
        }
        Update: {
          bracket_data?: Json | null
          bracket_type?: string
          created_at?: string | null
          id?: string
          league_id?: string
          qualifying_players_count?: number
          start_date?: string
          status?: string
          total_rounds?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playoff_tournaments_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_change_requests: {
        Row: {
          created_at: string | null
          current_rating: number
          id: string
          player_id: string
          reason: string
          requested_rating: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_rating: number
          id?: string
          player_id: string
          reason: string
          requested_rating: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_rating?: number
          id?: string
          player_id?: string
          reason?: string
          requested_rating?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rating_change_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          added_at: string
          id: string
          player_id: string
          status: string | null
          tournament_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          player_id: string
          status?: string | null
          tournament_id: string
        }
        Update: {
          added_at?: string
          id?: string
          player_id?: string
          status?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bracket_type: string
          created_at: string | null
          draw_size: number
          id: string
          location: string | null
          name: string
          organizer_id: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          bracket_type?: string
          created_at?: string | null
          draw_size: number
          id?: string
          location?: string | null
          name: string
          organizer_id: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          bracket_type?: string
          created_at?: string | null
          draw_size?: number
          id?: string
          location?: string | null
          name?: string
          organizer_id?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_current_integrity_status: {
        Row: {
          last_updated: string | null
          league_name: string | null
          stats_status: string | null
          total_losses: number | null
          total_matches: number | null
          total_players: number | null
          total_points: number | null
          total_wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_organization: {
        Args: { p_name: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
      }
      delete_match_atomic: {
        Args: { p_match_id: string; p_requesting_player_id: string }
        Returns: Json
      }
      fix_league_integrity: {
        Args: { p_league_id: string; p_dry_run?: boolean }
        Returns: {
          action_taken: string
          player_name: string
          old_values: Json
          new_values: Json
        }[]
      }
      get_available_players_today: {
        Args: {
          p_city_id?: string
          p_exclude_player_id?: string
          p_limit?: number
        }
        Returns: {
          id: string
          first_name: string
          last_name: string
          rating: number
          avatar_url: string
          available_today: boolean
          availability: Json
          homecourt_name: string
        }[]
      }
      get_integrity_history: {
        Args: { p_limit?: number }
        Returns: {
          check_time: string
          status: string
          total_players: number
          issues_found: number
          critical_issues: number
        }[]
      }
      get_integrity_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_leagues: number
          total_players: number
          players_with_issues: number
          critical_issues: number
          last_check_time: string
        }[]
      }
      increment_league_player_stat: {
        Args: {
          p_league_id: string
          p_player_id: string
          p_points_to_add: number
          p_wins_to_add: number
          p_losses_to_add: number
          p_matches_played_to_add: number
        }
        Returns: undefined
      }
      is_org_admin: {
        Args: { p_org: string }
        Returns: boolean
      }
      recalculate_all_player_stats_for_league: {
        Args: { p_league_id: string }
        Returns: undefined
      }
      reset_daily_availability: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_integrity_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      submit_match_atomic: {
        Args:
          | {
              p_player1_id: string
              p_player2_id: string
              p_winner_id: string
              p_match_date: string
              p_number_of_sets: number
              p_game_type: string
              p_match_type: string
              p_scores: Json
              p_submitted_by: string
              p_league_id: string
              p_competition_type?: string
              p_playoff_tournament_id?: string
            }
          | {
              p_player1_id: string
              p_player2_id: string
              p_winner_id: string
              p_match_date: string
              p_number_of_sets: number
              p_game_type: string
              p_match_type: string
              p_scores: Json
              p_submitted_by: string
              p_league_id?: string
            }
        Returns: Json
      }
      update_league_player_stats: {
        Args: {
          p_league_id: string
          p_player_id: string
          p_points_delta: number
          p_matches_delta: number
          p_wins_delta: number
          p_losses_delta: number
        }
        Returns: undefined
      }
      validate_league_integrity: {
        Args: { p_league_id?: string }
        Returns: {
          league_name: string
          player_name: string
          issue_type: string
          current_values: Json
          expected_values: Json
          severity: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Add custom types for better type safety
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export type AvailabilityData = {
  [key in DayOfWeek]?: TimeSlot[]
}

// Competition type enums
export type CompetitionType = 'round_robin' | 'playoffs_only' | 'ladder';
export type ParticipantType = 'singles' | 'doubles';

// Ladder configuration interface
export interface LadderConfig {
  max_challenge_positions: number;
  max_active_outgoing_challenges: number;
  rechallenge_cooldown_days: number;
  challenge_acceptance_deadline_days: number;
  match_completion_deadline_days: number;
  inactivity_threshold_days: number;
  inactivity_position_drop: number;
}

// Default ladder configuration
export const DEFAULT_LADDER_CONFIG: LadderConfig = {
  max_challenge_positions: 4,
  max_active_outgoing_challenges: 1,
  rechallenge_cooldown_days: 7,
  challenge_acceptance_deadline_days: 2,
  match_completion_deadline_days: 5,
  inactivity_threshold_days: 7,
  inactivity_position_drop: 2,
};

// Challenge status type
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed' | 'cancelled';

// Position change reason type
export type PositionChangeReason = 'match_win' | 'match_loss' | 'inactivity_penalty' | 'opponent_walkover' | 'admin_adjustment' | 'initial_placement';

// Doubles team interface
export interface DoublesTeam {
  id: string;
  league_id: string;
  player1_id: string;
  player2_id: string;
  team_name: string | null;
  combined_rating: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Ladder ranking interface
export interface LadderRanking {
  id: string;
  league_id: string;
  player_id: string | null;
  doubles_team_id: string | null;
  position: number;
  previous_position: number | null;
  last_match_date: string | null;
  last_activity_check: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Ladder challenge interface
export interface LadderChallenge {
  id: string;
  league_id: string;
  challenger_player_id: string | null;
  challenger_team_id: string | null;
  challenger_position: number;
  challenged_player_id: string | null;
  challenged_team_id: string | null;
  challenged_position: number;
  status: ChallengeStatus;
  acceptance_deadline: string;
  match_deadline: string | null;
  player_match_id: string | null;
  winner_player_id: string | null;
  winner_team_id: string | null;
  new_challenger_position: number | null;
  new_challenged_position: number | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

// Ladder position history interface
export interface LadderPositionHistory {
  id: string;
  league_id: string;
  player_id: string | null;
  doubles_team_id: string | null;
  old_position: number;
  new_position: number;
  change_reason: PositionChangeReason;
  challenge_id: string | null;
  created_at: string;
}