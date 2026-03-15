# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Turborepo + pnpm monorepo for the **Tenista** tennis league platform:
- **apps/app** — Expo 53 React Native mobile app (iOS/Android/Web)
- **apps/admin** — Next.js 15 admin panel
- **apps/landing** — Next.js 15 landing page (tenista.app)
- **packages/** — Shared packages (empty for now)

All apps share the same Supabase backend (Project ID: `zktbpqsqocblwjhcezum`).

## Getting Started

### Initial Setup
```bash
corepack enable
pnpm install          # Installs all workspace dependencies
```

### Environment Configuration

**Production** (`.env` / `.env.local` — used by Vercel and EAS builds):

- `apps/app/.env` — `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_POSTHOG_API_KEY`
- `apps/admin/.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `apps/landing/.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

**Local Development** (auto-loaded, points to local Supabase):

- `apps/admin/.env.development.local` — pre-configured with local Supabase keys
- `apps/landing/.env.development.local` — pre-configured with local Supabase keys
- `apps/app/.env.local` — copy from `.env.local.example` to use local Supabase

Next.js auto-loads `.env.development.local` in dev mode. Expo loads `.env.local` over `.env`.

## Supabase Local Development

### Prerequisites
- Docker Desktop installed and running
- Supabase CLI (`brew install supabase/tap/supabase`)
- PostgreSQL client (`brew install postgresql@15` — needed for psql)

### Daily Development
```bash
# Start local Supabase (first terminal) — uses setup script
./supabase/setup.sh start

# Start app dev server (second terminal)
pnpm dev:app    # or pnpm dev:admin

# Stop when done
supabase stop
```

**Important:** Use `./supabase/setup.sh start` instead of plain `supabase start`. The Supabase CLI can't apply dollar-quoted function bodies via its migration runner, so the setup script applies functions and RLS policies via psql after the tables migration.

Local services:
- **Postgres:** `localhost:54322` (user: postgres, password: postgres)
- **API:** `localhost:54321`
- **Studio Dashboard:** `localhost:54323`
- **Inbucket (email testing):** `localhost:54324`

### Auth Locally
- Use email/password (e.g., `admin@tenista.local` / `password123`)
- Check verification emails at `localhost:54324` (Inbucket)
- Google/Apple OAuth only works in production builds

### Schema Changes
```bash
# Create a new migration
supabase migration new add_some_feature

# Edit the migration file in supabase/migrations/
# Note: if the migration contains function definitions, put it in supabase/.skipped/
# and the setup script will apply it via psql

# Reset local database (re-runs all migrations + seed + functions)
./supabase/setup.sh reset

# When ready, push to production
supabase db push
```

### Seed Data
`supabase/seed.sql` contains synthetic test data: 8 players, 4 leagues, 10 courts, sample matches. Reset with `./supabase/setup.sh reset`.

Seed player avatar_urls are set to NULL so the app renders the `FallbackAvatar` component (centered initials). Do **not** use DiceBear SVG URLs — expo-image renders SVG text off-center on iOS.

### Troubleshooting: `99-roles.sql` / Unhealthy DB Container

Supabase CLI 2.78.1 ships a PG 15 Docker image (`public.ecr.aws/supabase/postgres:15.8.1.094`) whose entrypoint references `/docker-entrypoint-initdb.d/init-scripts/99-roles.sql`, but the file doesn't exist in the image. This causes the DB container to fail its healthcheck and enter a restart loop.

**Fix:** Build a patched image once and tag it to replace the original:
```bash
# One-time fix (only needed once per machine)
echo 'FROM public.ecr.aws/supabase/postgres:15.8.1.094
RUN echo "-- placeholder" > /docker-entrypoint-initdb.d/init-scripts/99-roles.sql' \
  | docker build -t public.ecr.aws/supabase/postgres:15.8.1.094 -

# Then start normally
./supabase/setup.sh start
```

If the container is stuck in a restart loop:
```bash
supabase stop --no-backup
docker rm -f $(docker ps -a --filter "name=supabase" --format "{{.ID}}")
docker volume rm supabase_db_tenista
# Re-apply the patched image tag (see above), then:
./supabase/setup.sh start
```

### Key Files
- `supabase/config.toml` — local dev configuration
- `supabase/migrations/` — SQL migration files (tables, indexes)
- `supabase/.skipped/` — Functions, RLS policies, triggers (applied via psql)
- `supabase/seed.sql` — test data for local dev
- `supabase/setup.sh` — start/reset script that handles the psql workaround

## Development Commands

### Turborepo (from root)
```bash
pnpm dev              # All apps
pnpm dev:app          # Expo mobile only
pnpm dev:admin        # Next.js admin only
pnpm dev:landing      # Next.js landing only
pnpm build            # Build all buildable apps
pnpm lint             # Lint all apps
pnpm clean            # Clean all build artifacts
```

### Mobile App (apps/app)
```bash
cd apps/app

# Start development server
npm start

# Platform-specific
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web browser

# Linting
npm run lint

# Production builds
npm run build:ios
npm run build:android
npm run build:production

# App store submission
npm run submit:ios
npm run submit:android

# Over-the-air updates
npm run update:preview
npm run update:production
```

### Admin Panel (apps/admin)
```bash
cd apps/admin

# Development
npm run dev          # Start dev server at localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code quality
npm run lint         # Run ESLint
```

## Architecture

### Mobile App (apps/app)

**Tech Stack:**
- React Native with Expo 53
- Supabase (Auth, Database, Storage)
- Tailwind CSS with NativeWind + Gluestack UI
- Expo Router (file-based routing)
- TanStack Query (data fetching/caching)
- TypeScript (strict mode)

**Key Directories:**
```
app/                    # Expo Router screens
├── (auth)/            # Authentication flow
├── (tabs)/            # Main app navigation
└── onboarding/        # User onboarding

components/            # Reusable UI components
├── ui/               # Base UI components
├── community/        # Community features
├── league/           # League management
└── onboarding/       # Onboarding components

lib/
├── actions/          # Supabase server actions
├── utils/           # Helper functions
└── validation/      # Zod schemas

contexts/            # React contexts (Auth, Theme)
hooks/              # Custom React hooks
```

**Key Patterns:**
- All database operations through `lib/actions/`
- TanStack Query for server state caching
- File-based routing with Expo Router
- NativeWind for styling (never inline styles)
- Lucide icons exclusively
- Theme system with light/dark mode

**Package Configuration:**
- Production: `com.tenista.app`
- Development: `com.tenista.app.dev`
- Allows side-by-side installation

**Google Sign-In:**
- iOS Client ID: `251208589749-gctj4up1ce36inf0l7cr99702hc8un3b.apps.googleusercontent.com`
- Web Client ID (Android): `251208589749-revsauposkj7bqt2ofu27b4k1cf9i3a1.apps.googleusercontent.com`
- Both package names must be registered in Google Cloud Console

### Admin Panel (apps/admin)

**Tech Stack:**
- Next.js 15.4.6 with App Router and Turbopack
- React 19.1.0
- Supabase SSR (@supabase/ssr v0.6.1)
- Tailwind CSS v3.4.17 + shadcn/ui (full component library)
- TanStack Table v8.21.3 (data tables)
- TanStack Query v5.84.2 (server state)
- React Hook Form v7.62.0 + Zod v4.0.17 (forms & validation)
- Recharts v3.1.2 (charts/analytics)
- Sonner v2.0.7 (toast notifications)
- date-fns v4.1.0 (date manipulation)
- Lucide React v0.539.0 (icons)
- TypeScript v5

**Key Directories:**
```
app/
├── (auth)/
│   └── login/        # Admin login page
├── (admin)/          # Protected admin routes (all functional)
│   ├── dashboard/    # Statistics and overview
│   ├── courts/       # Court CRUD with dialogs
│   ├── leagues/      # League management
│   │   └── [id]/     # League detail page
│   ├── matches/      # Match management
│   ├── players/      # Player management
│   ├── settings/     # Admin settings
│   └── layout.tsx    # Admin layout wrapper (uses AdminLayout component)
├── unauthorized/     # Non-admin user redirect page
└── layout.tsx        # Root layout with Toaster provider

components/
├── courts/           # Court-specific components
│   ├── court-dialog.tsx
│   ├── courts-client.tsx
│   └── courts-page-content.tsx
├── leagues/          # League-specific components
│   ├── league-dialog.tsx
│   ├── league-detail-client.tsx
│   ├── league-details-dialog.tsx
│   └── leagues-client.tsx
├── matches/          # Match-specific components
│   └── matches-client.tsx
├── layout/
│   └── admin-layout.tsx  # Full sidebar layout with navigation
├── tables/           # TanStack Table implementations
│   ├── courts-table.tsx
│   ├── leagues-table.tsx
│   ├── matches-table.tsx
│   └── players-table.tsx
├── providers/
│   └── toaster-provider.tsx
└── ui/              # Complete shadcn/ui library (22 components)
    ├── sidebar.tsx   # Custom collapsible sidebar
    ├── sheet.tsx     # Mobile menu
    ├── dialog.tsx
    ├── form.tsx
    ├── table.tsx
    ├── button.tsx
    ├── input.tsx
    ├── select.tsx
    ├── checkbox.tsx
    ├── switch.tsx
    ├── avatar.tsx
    ├── badge.tsx
    ├── card.tsx
    ├── dropdown-menu.tsx
    ├── alert-dialog.tsx
    ├── scroll-area.tsx
    ├── separator.tsx
    ├── skeleton.tsx
    ├── tabs.tsx
    └── label.tsx

lib/
├── supabase/
│   ├── client.ts     # Browser client (createBrowserSupabaseClient)
│   └── server.ts     # Server client with helpers
│       # - createServerSupabaseClient()
│       # - getServerUser()
│       # - getServerAdmin()
├── db-explorer.ts    # Database exploration utilities
├── supabase.ts       # Legacy/shared utilities
└── utils.ts          # cn() utility for class names

types/
└── database.types.ts # TypeScript interfaces for all DB tables

middleware.ts         # Auth & route protection
components.json       # shadcn/ui configuration
```

**Authentication Flow:**
- Middleware (`middleware.ts`) intercepts all routes except API, static files, and images
- Checks authentication via Supabase `auth.getUser()`
- Queries `admin_users` table to verify admin role (super_admin, league_admin, or support)
- Protected routes: `/dashboard`, `/matches`, `/courts`, `/players`, `/leagues`, `/settings`
- Unauthenticated users redirected to `/login` with `redirectTo` parameter
- Authenticated non-admin users redirected to `/unauthorized`
- Authenticated admins proceed with role added to `x-admin-role` header
- Login page redirects authenticated users to `/dashboard`
- Helper functions in `lib/supabase/server.ts`:
  - `createServerSupabaseClient()` - Creates server-side Supabase client
  - `getServerUser()` - Returns authenticated user or null
  - `getServerAdmin()` - Returns admin user data + role

**Data Fetching Pattern:**
- **Server Components** (page.tsx files) fetch data directly using `createServerSupabaseClient()`
- Data passed as props to **Client Components** for interactivity
- TanStack Table used in client components for sorting, filtering, pagination
- Toast notifications via Sonner for user feedback
- Forms use React Hook Form + Zod for validation
- No "use client" in pages - keeps initial load fast
- Example: `app/(admin)/courts/page.tsx` → `CourtsPageContent` (client) → `CourtsTable` (client with TanStack Table)

**Admin Layout & Navigation:**
- Full-height sidebar layout (`AdminLayout` component) with:
  - Collapsible sidebar (desktop only)
  - Brand logo linking to dashboard
  - Navigation items with icons (Lucide React)
  - User dropdown menu (profile, settings, logout)
  - Mobile-responsive with sheet/drawer
- Sidebar Navigation Items:
  1. Dashboard (LayoutDashboard icon)
  2. Leagues (Calendar icon)
  3. Matches (Trophy icon)
  4. Courts (MapPin icon)
  5. Players (Users icon)
  6. Settings (Settings icon)
- Active route highlighting
- Header bar with admin panel title and user menu

**Supabase Client Types:**
- **Browser Client** (`createBrowserSupabaseClient` in `lib/supabase/client.ts`): Client-side operations, used in client components
- **Server Client** (`createServerSupabaseClient` in `lib/supabase/server.ts`): Server component queries with cookie-based auth
- **Service Role Client** (not yet implemented): Admin operations bypassing RLS - requires `SUPABASE_SERVICE_ROLE_KEY` env var

**Utility Scripts (for development/debugging):**
- `check-admin-setup.js` - Verify admin user setup
- `check-all-match-tables.js` - Check match-related tables
- `check-player-matches.js` - Verify player matches data
- `create-admin-tables.sql` - SQL for creating admin tables
- `debug-auth.js` - Debug authentication issues
- `diagnose-supabase.js` - Diagnose Supabase connection
- `explore-db.js` - Explore database structure
- `setup-admin.js` / `setup-admin-direct.js` - Admin user setup scripts

## Shared Backend (Supabase)

**Production:**
- Project ID: `zktbpqsqocblwjhcezum`
- Project Name: Tenista
- Region: us-west-1

**Local Dev:**
- Schema: `supabase/migrations/` (source of truth)
- Seed data: `supabase/seed.sql`
- Config: `supabase/config.toml`
- Start: `supabase start` / Stop: `supabase stop`
- Use `supabase db push` to deploy migrations to production
- Use `supabase db reset` to rebuild local from migrations + seed

### Database Schema

#### Core User & Player Tables
- **`players`** (RLS enabled, 37 rows)
  - Core player/user profiles linked to auth system via `auth_user_id` (unique)
  - Basic info: first_name, last_name, rating (numeric), gender (male/female)
  - Contact: phone_country_code, phone_number, avatar_url
  - Location: city_id → cities, city_name, state_province, country_code, country_name, nationality_code, nationality_name
  - Home court: `homecourt_id` → courts
  - Onboarding: `onboarding_completed` (boolean, default: false)
  - Availability: availability (jsonb), available_today (boolean), available_today_updated_at
  - Notifications: `play_now_notifications_enabled` (default: false), `match_result_notifications_enabled` (default: true)
  - Status: `is_active` (boolean, default: true), status (text)
  - Timestamps: created_at, updated_at

#### Location & Venue Tables
- **`cities`** (RLS enabled, 4 rows)
  - City directory with lat/long coordinates
  - Fields: name, state_province, country_code, country_name, latitude, longitude
  - Tracking: `player_count`, `is_active`

- **`courts`** (RLS enabled, 83 rows)
  - Tennis court database with detailed facility info
  - Fields: name, city_id, address, court_type (outdoor/indoor), surface_type
  - Details: `number_of_courts`, `has_lights`, `is_public`
  - Data: contact_info (jsonb), amenities (array), operating_hours (jsonb), pricing (jsonb)
  - Status: `is_active`, `deleted_at` (soft delete)

#### League System Tables
- **`leagues`** (RLS disabled, 4 rows)
  - League configuration and management
  - Core: name, organizer_id, start_date, end_date, max_players, location
  - Settings: `is_private`, `is_active`, `is_free`, `price_cents`
  - Divisions: category (jsonb), division (enum: division_1-4), min_rating, max_rating
  - Points: `default_points_win`, `default_points_loss`
  - Playoffs: `has_playoffs`
  - Foreign key: `city_id` → cities

- **`league_players`** (RLS disabled, 7 rows)
  - Join table tracking player standings within leagues
  - Stats: points (≥0), matches_played (≥0), wins (≥0), losses (≥0)
  - Foreign keys: `league_id` → leagues, `player_id` → players

- **`league_matches`** (RLS disabled, 0 rows)
  - Scheduled league matches
  - Players: player1_id, player2_id, winner_id
  - Details: score (jsonb), match_type, game_type, number_of_sets
  - Status: status (scheduled/completed), played_at
  - Points: `points_winner`, `points_loser`
  - Foreign keys: league_id, player IDs, created_by

#### Match Recording Tables
- **`player_matches`** (RLS enabled, 9 rows)
  - Player-submitted match results (practice & competitive)
  - Players: player1_id, player2_id, winner_id, submitted_by
  - Details: match_date (validated 2020-01-01 to tomorrow), scores (jsonb array)
  - Type: game_type (practice/competitive), match_type (singles/doubles), number_of_sets (1/3/5)
  - Competition: `competition_type` (league/playoff/championship), `league_id`, `playoff_tournament_id`
  - Verification: `is_verified`

#### Playoff System Tables
- **`playoff_tournaments`** (RLS enabled, 0 rows)
  - Playoff tournament instances linked to leagues (one per league via unique constraint)
  - Status: status (not_started/in_progress/completed)
  - Config: total_rounds, qualifying_players_count, bracket_data (jsonb)
  - Foreign key: `league_id` → leagues (unique)

- **`playoff_participants`** (RLS enabled, 0 rows)
  - Players qualified for playoffs
  - Seeding: seed_position, league_position, league_points
  - Foreign keys: `playoff_tournament_id`, `player_id`

- **`playoff_rounds`** (RLS enabled, 0 rows)
  - Rounds within playoff tournament (quarterfinals, semifinals, finals)
  - Fields: round_number, round_name, status (not_started/in_progress/completed)
  - Foreign key: `playoff_tournament_id`

- **`playoff_matches`** (RLS enabled, 0 rows)
  - Individual playoff bracket matches
  - Players: player1_id, player2_id, winner_id
  - Match: match_number, `player_match_id` (links to player_matches table)
  - Byes: `is_bye` flag
  - Status: status (pending/completed/bye)
  - Foreign key: `playoff_round_id`

#### Tournament System Tables
- **`tournaments`** (RLS enabled, 4 rows)
  - Standalone bracket tournaments (not playoff-related)
  - Core: name, start_date, location, draw_size, organizer_id
  - Status: status (default: 'draft')

- **`tournament_participants`** (RLS disabled, 0 rows)
  - Tournament player registration
  - Fields: tournament_id, player_id, status (default: 'active')

- **`bracket_seeds`** (RLS enabled, 16 rows)
  - Tournament bracket seeding
  - Fields: tournament_id, player_id, seed_number, is_bye

- **`matches`** (RLS enabled, 8 rows)
  - Tournament bracket match records
  - Structure: tournament_id, round_number, match_number_in_round
  - Players: player_a_id, player_b_id, winner_id
  - Results: scores, `is_auto_advanced` (for byes)
  - Status: status (default: 'pending_scheduling')

#### Organization System Tables
- **`organizations`** (RLS enabled, 2 rows)
  - Entity for clubs, tennis academies, or league organizers
  - Fields: name, created_by

- **`organization_members`** (RLS enabled, 0 rows)
  - Organization staff/admins
  - Fields: organization_id, user_id, role (admin/member)

- **`organization_players`** (RLS enabled, 0 rows)
  - Players associated with organization
  - Join table: organization_id, player_id

#### Admin & System Tables
- **`admin_users`** (RLS enabled, 1 row)
  - Admin panel authentication
  - Links to `auth.users.id` (primary key)
  - Fields: role (super_admin/league_admin/support), permissions (jsonb), last_login

- **`admin_audit_log`** (RLS enabled, 0 rows)
  - Admin action tracking for compliance
  - Fields: admin_id, action, entity_type, entity_id, changes (jsonb)
  - Metadata: ip_address, user_agent, created_at

- **`rating_change_requests`** (RLS enabled, 0 rows)
  - Player-submitted rating adjustment requests
  - Fields: player_id, current_rating, requested_rating, reason
  - Status: status (pending/approved/rejected)

- **`integrity_check_log`** (RLS disabled, 2 rows)
  - System health monitoring
  - Fields: total_leagues, total_players, issues_found, critical_issues
  - Data: issues_detail (jsonb), status (HEALTHY/ISSUES_FOUND/CRITICAL)

#### Notification System Tables
- **`notification_tokens`** (RLS enabled, 0 rows)
  - Push notification device tokens
  - Fields: user_id, token, platform (ios/android/web), device_id

- **`notification_preferences`** (RLS enabled, 0 rows)
  - Per-user notification settings
  - Fields: user_id (unique), play_now_notifications, match_result_notifications
  - Radius: `notification_radius_km` (default: 10)
  - Quiet hours: quiet_hours_start, quiet_hours_end

- **`notification_history`** (RLS enabled, 0 rows)
  - Notification delivery audit log
  - Fields: recipient_user_id, sender_user_id, notification_type, title, body, data (jsonb)
  - Status: status (sent/failed/pending), error_message, sent_at

### Row Level Security (RLS)
- **Enabled on:** players, cities, courts, matches, tournaments, bracket_seeds, playoff_tournaments, playoff_participants, playoff_rounds, playoff_matches, player_matches, organizations, organization_members, organization_players, admin_users, admin_audit_log, rating_change_requests, notification_tokens, notification_preferences, notification_history
- **Disabled on:** leagues, league_players, league_matches, tournament_participants, integrity_check_log

### Supabase Client Usage
- **Admin panel:** Uses service role client to bypass RLS for management operations
- **Mobile app:** Uses anon key with RLS policies for user-scoped data access

## Development Guidelines

### Styling (Mobile App)
From `.cursor/rules/styling.mdc`:
- Follow atomic design, reuse components from `/components`
- Never use inline styles - always use Tailwind CSS
- Use Lucide icons exclusively
- Never hardcode colors/dimensions - use theme values
- Wrap screens with appropriate layout components
- Follow React Native accessibility best practices

### Code Organization
- Keep database operations in dedicated action files
- Use Zod schemas for all validation
- Implement proper error handling with try/catch
- Use TypeScript strict mode
- Follow existing patterns for consistency

### Next.js 15 Best Practices (Admin Panel)
From `.cursor/rules/webapp-frontend-rules.mdc`:
- Server Components by default (no 'use client' unless needed)
- Use 'use server' directive for server actions
- Consider `.server.ts` or `.client.ts` suffixes for clarity
- Prioritize shadcn/ui components, then Radix UI, then custom
- Never import server-specific code (like `next/headers`) in client components
- Use Server Actions for database operations and mutations
- Implement proper error boundaries between server and client code

### Testing
- Test mobile app on iOS, Android, and Web
- Test admin panel across browsers
- Verify authentication flows in both apps
- Check responsive design on various screen sizes

## Common Workflows

### Adding New Features to Mobile App
1. Create screen in appropriate `app/` directory
2. Add components to `/components/`
3. Create server actions in `lib/actions/`
4. Define Zod schemas in `lib/validation/`
5. Update TypeScript types if needed
6. Test on all platforms

### Adding New Admin Features
1. Create server component page in `app/(admin)/your-feature/page.tsx`
   - Fetch data using `createServerSupabaseClient()`
   - Keep page as server component (no 'use client')
   - Pass data to client components via props
2. Create client components in `components/your-feature/`
   - Mark with 'use client' directive
   - Use TanStack Table for data tables
   - Use shadcn/ui components (already installed)
   - Implement forms with React Hook Form + Zod
3. Create table component in `components/tables/your-feature-table.tsx`
   - Use TanStack Table with sorting, filtering, pagination
   - Add action columns with dialogs
4. Add navigation item to `components/layout/admin-layout.tsx`
   - Import appropriate icon from lucide-react
   - Add to `sidebarItems` array
5. Create TypeScript types in `types/database.types.ts` if needed
6. Test with proper admin authentication
7. Add toast notifications (Sonner) for user feedback

**Example Pattern:**
```typescript
// app/(admin)/your-feature/page.tsx (Server Component)
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { YourFeatureContent } from "@/components/your-feature/your-feature-content"

async function getData() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('your_table').select('*')
  return data || []
}

export default async function YourFeaturePage() {
  const data = await getData()
  return <YourFeatureContent data={data} />
}
```

### Database Changes
1. Create a migration: `supabase migration new your_feature_name`
2. Write SQL in `supabase/migrations/<timestamp>_your_feature_name.sql`
3. Test locally: `supabase db reset` (re-runs all migrations + seed)
4. Push to production: `supabase db push`
5. Regenerate TypeScript types: `supabase gen types typescript`
6. Update both app and admin TypeScript type files
7. Update seed.sql if new tables need test data

## Deployment

### Mobile App (apps/app)
- Use EAS Build for production builds
- Environment variables must be prefixed with `EXPO_PUBLIC_`
- OTA updates work for JS/config changes only
- Native code changes require new builds

### Admin Panel (apps/admin) — Vercel
- **Project:** `tenista-admin` → `tenista-admin.vercel.app`
- **Root Directory:** `apps/admin`
- **GitHub Repo:** `riglesias/tenista` (monorepo)
- Deploys automatically on push to main

### Landing Page (apps/landing) — Vercel
- **Project:** `tenista-landing` → `www.tenista.app`
- **Root Directory:** `apps/landing`
- **GitHub Repo:** `riglesias/tenista` (monorepo)
- Deploys automatically on push to main

## Project Status

**Mobile App:**
- ✅ Authentication (Google Sign-In, Apple)
- ✅ User onboarding
- ✅ Community features
- ✅ League browsing
- ✅ Match scheduling

**Admin Panel:**
- ✅ Admin authentication with Supabase (login page functional)
- ✅ Protected routes with middleware (`middleware.ts`)
- ✅ Admin user role checking via `admin_users` table (super_admin, league_admin, support)
- ✅ Complete shadcn/ui component library installed (22 components)
- ✅ Full admin layout with collapsible sidebar navigation
- ✅ Dashboard page with statistics
- ✅ Court management - Full CRUD with TanStack Table
  - ✅ Data table with sorting, filtering, pagination
  - ✅ Create/Edit court dialog
  - ✅ View court details
  - ✅ Soft delete with status toggle
  - ✅ Statistics cards (total, public, private, with lights)
- ✅ League management
  - ✅ Leagues list with TanStack Table
  - ✅ League detail page with [id] route
  - ✅ Create/Edit league dialog
  - ✅ League details dialog
- ✅ Match management with TanStack Table
- ✅ Player management with TanStack Table
- ✅ Settings page
- ✅ Unauthorized page for non-admin users
- ✅ Toast notifications (Sonner)
- ✅ Responsive design (mobile + desktop)
- ✅ TypeScript types for all database tables
- ⏳ Service role client implementation (currently using regular client)
- ⏳ Audit logging functionality (table exists, needs implementation)
- ⏳ Dashboard analytics charts (Recharts installed but not implemented)
- ⏳ Complete form validation for all entities
