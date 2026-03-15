-- =============================================================================
-- Tenista: Seed Data for Local Development
-- =============================================================================
-- Run after migrations. All test users use password: password123
-- Admin login: admin@tenista.local / password123
-- =============================================================================

-- ============================================================
-- 1. Auth Users (8 test accounts)
-- ============================================================
-- Fixed UUIDs so we can reference them in players, admin_users, etc.

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, aud, role,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current, email_change_confirm_status,
  phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
)
VALUES
  -- admin@tenista.local — the super admin
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'admin@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false),

  -- player1 through player7
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'player1@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false),

  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'player2@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false),

  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'player3@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false),

  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
   'player4@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false),

  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000',
   'player5@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false),

  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000',
   'player6@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false),

  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000',
   'player7@tenista.local', crypt('password123', gen_salt('bf')), now(),
   'authenticated', 'authenticated',
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', 0, '', '', '', false, false);

-- Also insert into auth.identities (required by Supabase Auth for email login)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'admin@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000001', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000002', 'email', 'player1@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000002', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000003', 'email', 'player2@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000003', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000004', 'email', 'player3@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000004', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000005', 'email', 'player4@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000005', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000006', 'email', 'player5@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000006', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000007', 'email', 'player6@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000007', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008',
   jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000008', 'email', 'player7@tenista.local'),
   'email', 'a0000000-0000-0000-0000-000000000008', now(), now(), now());


-- ============================================================
-- 2. Cities (4 cities)
-- ============================================================

INSERT INTO public.cities (id, name, state_province, country_code, country_name, latitude, longitude, is_active, player_count)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Denver',          'Colorado',           'US', 'United States', 39.7392, -104.9903, true, 4),
  ('c0000000-0000-0000-0000-000000000002', 'Salt Lake City',  'Utah',               'US', 'United States', 40.7608, -111.8910, true, 1),
  ('c0000000-0000-0000-0000-000000000003', 'Santiago',         'Región Metropolitana','CL', 'Chile',        -33.4489, -70.6693,  true, 2),
  ('c0000000-0000-0000-0000-000000000004', 'Miami',            'Florida',            'US', 'United States', 25.7617, -80.1918,  true, 1);


-- ============================================================
-- 3. Courts (10 courts across 4 cities)
-- ============================================================

INSERT INTO public.courts (id, name, city_id, address, court_type, surface_type, number_of_courts, has_lights, is_public, is_active)
VALUES
  -- Denver (4 courts)
  ('d0000000-0000-0000-0000-000000000001', 'Park West Country Club',    'c0000000-0000-0000-0000-000000000001',
   '1000 Park West Dr, Denver, CO 80205',        'outdoor', 'hard',  8, true,  false, true),
  ('d0000000-0000-0000-0000-000000000002', 'Washington Park Courts',    'c0000000-0000-0000-0000-000000000001',
   '701 S Franklin St, Denver, CO 80209',         'outdoor', 'hard',  6, true,  true,  true),
  ('d0000000-0000-0000-0000-000000000003', 'Denver Indoor Tennis',      'c0000000-0000-0000-0000-000000000001',
   '4500 E 9th Ave, Denver, CO 80220',            'indoor',  'hard',  4, true,  false, true),
  ('d0000000-0000-0000-0000-000000000004', 'City Park Recreation',      'c0000000-0000-0000-0000-000000000001',
   '2001 Steele St, Denver, CO 80205',            'outdoor', 'clay',  4, false, true,  true),

  -- Salt Lake City (2 courts)
  ('d0000000-0000-0000-0000-000000000005', 'Liberty Park Tennis',       'c0000000-0000-0000-0000-000000000002',
   '600 E 900 S, Salt Lake City, UT 84105',       'outdoor', 'hard',  8, true,  true,  true),
  ('d0000000-0000-0000-0000-000000000006', 'Salt Lake Tennis Club',     'c0000000-0000-0000-0000-000000000002',
   '1390 S 1100 E, Salt Lake City, UT 84105',     'outdoor', 'hard',  6, true,  false, true),

  -- Santiago (2 courts)
  ('d0000000-0000-0000-0000-000000000007', 'Club de Tenis Lo Curro',    'c0000000-0000-0000-0000-000000000003',
   'Av. Padre Hurtado 1700, Lo Barnechea',        'outdoor', 'clay', 10, true,  false, true),
  ('d0000000-0000-0000-0000-000000000008', 'Canchas Parque Araucano',   'c0000000-0000-0000-0000-000000000003',
   'Presidente Riesco 5330, Las Condes',           'outdoor', 'clay',  4, false, true,  true),

  -- Miami (2 courts)
  ('d0000000-0000-0000-0000-000000000009', 'Crandon Park Tennis',       'c0000000-0000-0000-0000-000000000004',
   '7300 Crandon Blvd, Key Biscayne, FL 33149',   'outdoor', 'hard', 26, true,  true,  true),
  ('d0000000-0000-0000-0000-000000000010', 'Flamingo Park Tennis',      'c0000000-0000-0000-0000-000000000004',
   '999 11th St, Miami Beach, FL 33139',           'outdoor', 'hard', 17, true,  true,  true);


-- ============================================================
-- 4. Players (8 players linked to auth users)
-- ============================================================
-- Note: The handle_new_user() trigger may auto-create player rows on auth insert.
-- We use ON CONFLICT to handle that, updating the row with our seed data.

INSERT INTO public.players (id, auth_user_id, first_name, last_name, rating, gender, city_id, city_name, state_province, country_code, country_name, nationality_code, nationality_name, homecourt_id, onboarding_completed, is_active, phone_country_code, phone_number, avatar_url)
VALUES
  -- Admin: Roberto Iglesias — Denver, 4.0, completed onboarding
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Roberto', 'Iglesias', 4.0, 'male',
   'c0000000-0000-0000-0000-000000000001', 'Denver', 'Colorado', 'US', 'United States', 'CL', 'Chile',
   'd0000000-0000-0000-0000-000000000001', true, true, '+1', '3035551001',
   NULL),

  -- Player 1: Maria Garcia — Denver, 3.5, completed onboarding
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   'Maria', 'Garcia', 3.5, 'female',
   'c0000000-0000-0000-0000-000000000001', 'Denver', 'Colorado', 'US', 'United States', 'MX', 'Mexico',
   'd0000000-0000-0000-0000-000000000002', true, true, '+1', '3035551002',
   NULL),

  -- Player 2: James Wilson — Denver, 4.5, completed onboarding
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003',
   'James', 'Wilson', 4.5, 'male',
   'c0000000-0000-0000-0000-000000000001', 'Denver', 'Colorado', 'US', 'United States', 'US', 'United States',
   'd0000000-0000-0000-0000-000000000001', true, true, '+1', '3035551003',
   NULL),

  -- Player 3: Ana Morales — Denver, 3.0, completed onboarding
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
   'Ana', 'Morales', 3.0, 'female',
   'c0000000-0000-0000-0000-000000000001', 'Denver', 'Colorado', 'US', 'United States', 'AR', 'Argentina',
   'd0000000-0000-0000-0000-000000000004', true, true, '+1', '3035551004',
   NULL),

  -- Player 4: David Chen — Salt Lake City, 4.0, completed onboarding
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005',
   'David', 'Chen', 4.0, 'male',
   'c0000000-0000-0000-0000-000000000002', 'Salt Lake City', 'Utah', 'US', 'United States', 'US', 'United States',
   'd0000000-0000-0000-0000-000000000005', true, true, '+1', '8015551005',
   NULL),

  -- Player 5: Catalina Rojas — Santiago, 5.0, completed onboarding
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006',
   'Catalina', 'Rojas', 5.0, 'female',
   'c0000000-0000-0000-0000-000000000003', 'Santiago', 'Región Metropolitana', 'CL', 'Chile', 'CL', 'Chile',
   'd0000000-0000-0000-0000-000000000007', true, true, '+56', '912345006',
   NULL),

  -- Player 6: Felipe Vargas — Santiago, 2.0, NOT completed onboarding
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007',
   'Felipe', 'Vargas', 2.0, 'male',
   'c0000000-0000-0000-0000-000000000003', 'Santiago', 'Región Metropolitana', 'CL', 'Chile', 'CL', 'Chile',
   NULL, false, true, NULL, NULL,
   NULL),

  -- Player 7: Sophie Martinez — Miami, 3.5, NOT completed onboarding
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008',
   'Sophie', 'Martinez', 3.5, 'female',
   'c0000000-0000-0000-0000-000000000004', 'Miami', 'Florida', 'US', 'United States', 'US', 'United States',
   NULL, false, true, NULL, NULL,
   NULL)
ON CONFLICT (auth_user_id) DO UPDATE SET
  id = EXCLUDED.id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  rating = EXCLUDED.rating,
  gender = EXCLUDED.gender,
  city_id = EXCLUDED.city_id,
  city_name = EXCLUDED.city_name,
  state_province = EXCLUDED.state_province,
  country_code = EXCLUDED.country_code,
  country_name = EXCLUDED.country_name,
  nationality_code = EXCLUDED.nationality_code,
  nationality_name = EXCLUDED.nationality_name,
  homecourt_id = EXCLUDED.homecourt_id,
  onboarding_completed = EXCLUDED.onboarding_completed,
  is_active = EXCLUDED.is_active,
  phone_country_code = EXCLUDED.phone_country_code,
  phone_number = EXCLUDED.phone_number,
  avatar_url = EXCLUDED.avatar_url;


-- ============================================================
-- 5. Organizations / Clubs (2 clubs)
-- ============================================================
-- Must come after players because created_by references players.id

INSERT INTO public.organizations (id, name, created_by, join_code, image_url, court_id)
VALUES
  -- Park West Country Club in Denver, linked to court d...001
  ('e0000000-0000-0000-0000-000000000001', 'Park West Country Club',
   'b0000000-0000-0000-0000-000000000001', 'PWCC2026', NULL,
   'd0000000-0000-0000-0000-000000000001'),

  -- Club de Tenis Lo Curro in Santiago, linked to court d...007
  ('e0000000-0000-0000-0000-000000000002', 'Club de Tenis Lo Curro',
   'b0000000-0000-0000-0000-000000000001', 'CURRO123', NULL,
   'd0000000-0000-0000-0000-000000000007');


-- ============================================================
-- 6. Admin User (super_admin)
-- ============================================================

INSERT INTO public.admin_users (id, role, permissions, last_login)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'super_admin', '{"all": true}'::jsonb, now());


-- ============================================================
-- 7. Organization Members & Players
-- ============================================================

-- Admin is the org admin for PWCC (user_id references players.id)
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'admin');

-- Link players to PWCC (Roberto, Maria, James)
INSERT INTO public.organization_players (organization_id, player_id)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003');

-- Link Catalina to Lo Curro
INSERT INTO public.organization_players (organization_id, player_id)
VALUES
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006');


-- ============================================================
-- 8. Leagues (4 leagues)
-- ============================================================

INSERT INTO public.leagues (id, name, organizer_id, start_date, end_date, max_players, location, is_private, city_id, division, min_rating, max_rating, is_active, is_free, competition_type, participant_type, organization_id, default_points_win, default_points_loss, has_playoffs, ladder_config)
VALUES
  -- Escalerilla PWCC: ladder league, linked to PWCC org, Denver
  ('f0000000-0000-0000-0000-000000000001',
   'Escalerilla PWCC',
   'b0000000-0000-0000-0000-000000000001',
   '2026-01-01', '2026-06-30', 20, 'Park West Country Club, Denver',
   true, 'c0000000-0000-0000-0000-000000000001',
   'open', NULL, NULL, true, true,
   'ladder', 'singles',
   'e0000000-0000-0000-0000-000000000001',
   1, 0, false,
   '{"max_challenge_positions": 4, "max_active_outgoing_challenges": 1, "acceptance_deadline_days": 3, "match_deadline_days": 7}'::jsonb),

  -- Summer League 3.0-3.5: round robin, Denver
  ('f0000000-0000-0000-0000-000000000002',
   'Summer League 3.0-3.5',
   'b0000000-0000-0000-0000-000000000001',
   '2026-03-01', '2026-08-31', 12, 'Washington Park Courts, Denver',
   false, 'c0000000-0000-0000-0000-000000000001',
   'intermediate', 3.0, 3.5, true, true,
   'round_robin', 'singles',
   NULL,
   3, 0, true, NULL),

  -- Summer League 4.0-4.5: round robin, Denver
  ('f0000000-0000-0000-0000-000000000003',
   'Summer League 4.0-4.5',
   'b0000000-0000-0000-0000-000000000001',
   '2026-03-01', '2026-08-31', 12, 'Denver Indoor Tennis',
   false, 'c0000000-0000-0000-0000-000000000001',
   'advanced', 4.0, 4.5, true, true,
   'round_robin', 'singles',
   NULL,
   3, 0, true, NULL),

  -- Sunday Utah Park: ladder league, Salt Lake City
  ('f0000000-0000-0000-0000-000000000004',
   'Sunday Utah Park',
   'b0000000-0000-0000-0000-000000000005',
   '2026-02-01', '2026-07-31', 16, 'Liberty Park Tennis, SLC',
   false, 'c0000000-0000-0000-0000-000000000002',
   'open', NULL, NULL, true, true,
   'ladder', 'singles',
   NULL,
   1, 0, false,
   '{"max_challenge_positions": 3, "max_active_outgoing_challenges": 1, "acceptance_deadline_days": 3, "match_deadline_days": 7}'::jsonb);


-- ============================================================
-- 9. League Players (3-5 per league)
-- ============================================================
-- Note: check_stats_consistency requires (wins + losses) = matches_played

-- Escalerilla PWCC: Roberto, Maria, James, Ana (4 players)
INSERT INTO public.league_players (league_id, player_id, points, matches_played, wins, losses, status)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3, 4, 3, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 2, 3, 2, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 4, 5, 4, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 0, 2, 0, 2, 'active');

-- Summer League 3.0-3.5: Maria, Ana, Sophie (3 players)
INSERT INTO public.league_players (league_id, player_id, points, matches_played, wins, losses, status)
VALUES
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 6, 3, 2, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 3, 3, 1, 2, 'active'),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008', 6, 2, 2, 0, 'active');

-- Summer League 4.0-4.5: Roberto, James, Catalina, David (4 players)
INSERT INTO public.league_players (league_id, player_id, points, matches_played, wins, losses, status)
VALUES
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 6, 3, 2, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 9, 4, 3, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 3, 3, 1, 2, 'active'),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 0, 2, 0, 2, 'active');

-- Sunday Utah Park: David, Roberto, James (3 players)
INSERT INTO public.league_players (league_id, player_id, points, matches_played, wins, losses, status)
VALUES
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 2, 3, 2, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 1, 2, 1, 1, 'active'),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 1, 3, 1, 2, 'active');


-- ============================================================
-- 10. Ladder Rankings (for ladder-type leagues)
-- ============================================================

-- Escalerilla PWCC ladder positions (by rating/performance)
INSERT INTO public.ladder_rankings (league_id, player_id, position, previous_position, is_active, wins, losses)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 1, 2, true, 4, 1),  -- James #1
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 2, 1, true, 3, 1),  -- Roberto #2
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 3, 3, true, 2, 1),  -- Maria #3
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 4, 4, true, 0, 2);  -- Ana #4

-- Sunday Utah Park ladder positions
INSERT INTO public.ladder_rankings (league_id, player_id, position, previous_position, is_active, wins, losses)
VALUES
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 1, 1, true, 2, 1),  -- David #1
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 2, 3, true, 1, 1),  -- Roberto #2
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 3, 2, true, 1, 2);  -- James #3


-- ============================================================
-- 11. Player Matches (5 sample matches)
-- ============================================================

INSERT INTO public.player_matches (id, player1_id, player2_id, winner_id, match_date, number_of_sets, game_type, match_type, scores, submitted_by, league_id, competition_type)
VALUES
  -- Match 1: James beat Roberto, competitive in Escalerilla PWCC, 2 sets
  ('aa000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003', -- James (p1)
   'b0000000-0000-0000-0000-000000000001', -- Roberto (p2)
   'b0000000-0000-0000-0000-000000000003', -- James won
   '2026-03-01 10:00:00', 3, 'competitive', 'singles',
   '[{"player1": 6, "player2": 4}, {"player1": 3, "player2": 6}, {"player1": 6, "player2": 2}]'::jsonb,
   'b0000000-0000-0000-0000-000000000003',
   'f0000000-0000-0000-0000-000000000001', 'league'),

  -- Match 2: Roberto beat Maria, competitive in Escalerilla PWCC, 2 sets
  ('aa000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001', -- Roberto (p1)
   'b0000000-0000-0000-0000-000000000002', -- Maria (p2)
   'b0000000-0000-0000-0000-000000000001', -- Roberto won
   '2026-03-05 18:00:00', 3, 'competitive', 'singles',
   '[{"player1": 6, "player2": 3}, {"player1": 6, "player2": 4}]'::jsonb,
   'b0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001', 'league'),

  -- Match 3: Maria beat Ana, competitive in Summer 3.0-3.5, straight sets
  ('aa000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000002', -- Maria (p1)
   'b0000000-0000-0000-0000-000000000004', -- Ana (p2)
   'b0000000-0000-0000-0000-000000000002', -- Maria won
   '2026-03-08 09:00:00', 3, 'competitive', 'singles',
   '[{"player1": 6, "player2": 2}, {"player1": 6, "player2": 1}]'::jsonb,
   'b0000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000002', 'league'),

  -- Match 4: Practice match — Catalina beat Roberto, no league
  ('aa000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000006', -- Catalina (p1)
   'b0000000-0000-0000-0000-000000000001', -- Roberto (p2)
   'b0000000-0000-0000-0000-000000000006', -- Catalina won
   '2026-03-10 16:00:00', 1, 'practice', 'singles',
   '[{"player1": 6, "player2": 4}]'::jsonb,
   'b0000000-0000-0000-0000-000000000006',
   NULL, NULL),

  -- Match 5: David beat James, competitive in Sunday Utah Park, 3 sets
  ('aa000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000005', -- David (p1)
   'b0000000-0000-0000-0000-000000000003', -- James (p2)
   'b0000000-0000-0000-0000-000000000005', -- David won
   '2026-03-12 11:00:00', 3, 'competitive', 'singles',
   '[{"player1": 6, "player2": 4}, {"player1": 3, "player2": 6}, {"player1": 7, "player2": 5}]'::jsonb,
   'b0000000-0000-0000-0000-000000000005',
   'f0000000-0000-0000-0000-000000000004', 'league');


-- ============================================================
-- Done! Summary of seeded data:
-- ============================================================
-- 8 auth users (admin + 7 players), all with password: password123
-- 4 cities: Denver, Salt Lake City, Santiago, Miami
-- 10 courts across all 4 cities
-- 2 organizations (PWCC in Denver, Lo Curro in Santiago)
-- 8 players with varying ratings (2.0-5.0), genders, cities
-- 1 super_admin (admin@tenista.local)
-- 4 leagues (2 ladder, 2 round_robin)
-- 14 league_player enrollments
-- 7 ladder rankings (4 in Escalerilla, 3 in Sunday Utah)
-- 5 player_matches (4 competitive, 1 practice)
-- 4 organization_players linked to clubs
-- ============================================================
