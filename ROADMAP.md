# Tenista Product Roadmap

> Last updated: March 2026
> Goal: Launch on Android (Google Play) and stabilize iOS for growth

## Current State

Tenista is a tennis community app for finding partners, joining flex leagues, tracking ladder rankings, and submitting match results. It's live on the iOS App Store with ~37 registered players across 4 cities (Santiago, Denver, Miami, and more).

### What's Working
- Full auth flow (email, Google, Apple Sign-In)
- 7-step onboarding (profile, location, rating, court/club, availability, contact, nationality)
- Community player discovery with real-time availability
- League system with standings, ladder challenges, and playoffs
- Match submission with score validation and result sharing
- Club/homecourt system tied to organizations
- i18n (English + Spanish)
- Admin panel for managing players, leagues, courts, clubs, matches, reports
- Landing page at tenista.app with password reset flow

### What's Not Working / Missing
- Android not on Google Play (builds exist but never submitted)
- ~~89 `Alert.alert()` calls need migration to toast notifications~~ ✅ Done
- No analytics (zero visibility into user behavior)
- No monetization (league pricing fields exist but aren't enforced)
- ~~Playoff controls (suspend/resume/advance) are stubbed~~ ✅ Implemented
- No push notification delivery (tokens registered but no backend sends)

---

## Phase 1: Android Launch Readiness (2 weeks)

The goal is to get the Android APK/AAB into Google Play. iOS is already live, so Android is the bottleneck.

### 1.1 Alert-to-Toast Migration ✅ COMPLETE
Replaced all `Alert.alert()` / `window.alert()` / `window.confirm()` calls with `useAppToast` (simple notifications) and a new `useConfirmDialog` (destructive confirmations). 39 files changed, 0 alerts remaining.

- [x] Auth screens (sign-in, sign-up, email-sign-in, forgot-password)
- [x] Onboarding screens (profile, location, rating, availability, contact, flag, homecourt)
- [x] Edit profile screens (edit-profile, edit-location, edit-flag, edit-rating, edit-availability, edit-homecourt)
- [x] Main app screens (community, results, settings, submit-result, player-profile)
- [x] UI components (GoogleSignIn, AppleSignIn, AvatarPicker, DeleteAccountModal, MatchResultScreen)
- [x] League components (LeagueMenu, LeagueSelection, CurrentLeague, PlayoffControls, QualifyingPlayersCard)
- [x] Ladder (LadderTab — 17 alerts migrated)
- [x] Other (DoublesTeamFormSheet, useMatchData, onboarding-helpers)
- [x] Built `ConfirmDialog` component for destructive actions (logout, leave league, delete account, challenges)

### 1.2 Android-Specific QA
- [ ] Test Google Sign-In on real Android device (Play Services availability)
- [ ] Test hardware back button behavior across all flows
- [ ] Test keyboard handling on Android (soft keyboard overlapping inputs)
- [ ] Test permission dialogs (camera, media library, notifications) on Android 13+
- [ ] Test on small screen (360dp width) and large screen (412dp width)
- [ ] Verify deep links work (`tenistaapp://` scheme)

### 1.3 Google Play Console Setup
- [ ] Create Google Play Console account ($25 one-time)
- [ ] Set up app listing (title, description, screenshots, feature graphic)
- [ ] Configure content rating questionnaire
- [ ] Set up closed testing track for initial review
- [ ] Prepare privacy policy URL (link from landing page `/terms`)
- [ ] Build production AAB: `eas build --platform android --profile production`
- [ ] Submit to Google Play review

### 1.4 Fix Broken Features
- [x] Implement playoff control mutations (suspend, resume, advance round)
- [ ] Fix `/terms` page on landing to include privacy policy section
- [ ] Fix "Get Started" button on landing navbar (currently non-functional)
- [ ] Fix "Contact Us" and "Help Center" footer links on landing

### 1.5 Code Quality Hardening ✅ COMPLETE
- [x] Stripped 370+ console.log/error/warn statements from production code (35+ files)
- [x] Fixed stubbed edit match — now navigates to submit-result with edit params
- [x] Internationalized hardcoded English strings across 10 files (EN + ES translations)
- [x] Fixed silent error handling in AuthContext (8 TODO catch blocks resolved)
- [x] Added performance optimizations (useMemo/useCallback/React.memo) to 5 largest components

---

## Phase 2: Production Hardening (2 weeks)

Ship quality-of-life improvements and set up the infrastructure needed to grow.

### 2.1 Analytics & Monitoring
- [ ] Add Sentry DSN to production environment (crash reporting already integrated, just needs the key)
- [ ] Add analytics SDK (PostHog or Mixpanel) to track key events:
  - Sign up completed
  - Onboarding step completed / dropped
  - League joined
  - Match submitted
  - Player profile viewed
  - "Play Now" availability toggled
- [ ] Add Vercel Web Analytics to landing page and admin panel
- [ ] Set up basic dashboard for daily actives, retention, funnel drop-off

### 2.2 Push Notifications (Backend)
The mobile app already registers device tokens and has notification preferences. What's missing is the server-side trigger.

- [ ] Create Supabase Edge Function for sending push notifications via Expo Push API
- [ ] Trigger "Play Now" notification when a nearby player toggles availability
- [ ] Trigger "Match Result" notification when opponent submits a result
- [ ] Trigger "Challenge Received" notification for ladder challenges
- [ ] Respect user preferences (quiet hours, radius, per-type toggles)

### 2.3 Performance
- [ ] Replace custom RangeSlider with `@react-native-community/slider` or gesture-based implementation
- [ ] Add pagination to PlayerList (currently renders all filtered players)
- [ ] Add image caching for player avatars (reduce Supabase storage bandwidth)

### 2.4 Landing & Admin Polish
- [ ] Add Open Graph + Twitter Card meta tags to landing (social sharing previews)
- [ ] Add `sitemap.xml` and `robots.txt` to landing for SEO
- [ ] Add error boundaries (`error.tsx`) to both admin and landing
- [ ] Enable Android download button on landing page once Play Store listing is live
- [ ] Fix admin TypeScript/ESLint errors and remove `ignoreDuringBuilds` flags

### 2.5 Admin Panel — Operational Features
Priority admin improvements to unblock day-to-day league operations.

**Dashboard Analytics (high impact)**
- [ ] Matches played over time chart (weekly/monthly trend line)
- [ ] New player signups over time chart
- [ ] League participation rate chart
- [ ] Use Recharts (already installed, currently unused)

**Player Edit Capability (unblocks support)**
- [ ] Player edit dialog — edit rating, name, contact info directly
- [ ] Toggle player active/inactive status from table
- [ ] Inline rating override (bypass rating request workflow)

**Admin Users Management (enables delegation)**
- [ ] Settings → Admin Users page with list of current admins
- [ ] Add/remove admin users with role assignment (super_admin, league_admin, support)
- [ ] No more raw SQL to onboard new admins

**Secondary improvements**
- [ ] Match result editing from admin (close the loop: review report → fix match → resolve)
- [ ] Audit log viewer page (data already logged to `admin_audit_log`, needs UI)
- [ ] CSV export for players, matches, and standings (buttons exist, not wired)
- [ ] League archive/delete capability (prevent clutter as seasons accumulate)

---

## Phase 3: Growth Features (4 weeks)

Features that drive engagement and retention once we have users on both platforms.

### 3.1 League Discovery
Currently, once you join a league, you can't browse others. This limits discovery.

- [ ] Add "Browse Leagues" tab alongside "My League"
- [ ] Show league cards with player count, rating range, start date, club name
- [ ] Allow viewing league details without joining
- [ ] Add "Notify me when registration opens" for upcoming leagues

### 3.2 Match Sharing & Social
The shareable match card component exists but isn't fully wired.

- [ ] Polish ShareableMatchCard for Instagram Stories / WhatsApp sharing
- [ ] Add "Share Profile" link for player referrals
- [ ] Add match history on player profile (currently only stats)

### 3.3 Scheduling & Court Booking
- [ ] Add in-app match scheduling between two players (propose time + court)
- [ ] Show court availability if courts provide operating hours data
- [ ] Calendar view for upcoming matches

### 3.4 Doubles Support
Code exists for doubles teams but isn't fully integrated into the UX.

- [ ] Complete doubles team creation/management UI
- [ ] Add doubles league type
- [ ] Support doubles match submission with 4 players

---

## Phase 4: Monetization (4 weeks)

League pricing fields (`price_cents`, `is_free`) exist in the database but aren't enforced.

### 4.1 Paid Leagues
- [ ] Integrate RevenueCat or Stripe for in-app payments
- [ ] Enforce payment gate on league join when `is_free = false`
- [ ] Add league organizer payout flow (clubs collect fees)
- [ ] Receipt/invoice generation

### 4.2 Premium Features (Future)
- [ ] Advanced player stats and match analytics
- [ ] Priority matchmaking / featured player badge
- [ ] Ad-free experience
- [ ] Tournament creation (currently admin-only)

---

## Phase 5: Scale (Ongoing)

### 5.1 New Markets
- [ ] Add Portuguese (Brazil) translations
- [ ] Expand city directory beyond current 4 cities
- [ ] Add city-level admin roles for local organizers

### 5.2 Infrastructure
- [ ] CI/CD pipeline (GitHub Actions for build + test on PR)
- [ ] Staging environment for pre-release testing
- [ ] Automated E2E tests (Detox or Maestro for mobile)
- [ ] Database migration workflow (currently manual SQL)

### 5.3 Community
- [ ] In-app chat between players (Supabase Realtime)
- [ ] League-level group chat / announcements
- [ ] Player reviews / endorsements
- [ ] Club-managed events and tournaments

---

## Key Metrics to Track Post-Launch

| Metric | Target (Month 1) | Target (Month 3) |
|--------|-------------------|-------------------|
| Weekly Active Users | 50 | 200 |
| Matches submitted / week | 20 | 100 |
| Onboarding completion rate | > 60% | > 75% |
| Day-7 retention | > 25% | > 35% |
| App store rating | > 4.0 | > 4.3 |
| Crash-free rate | > 99% | > 99.5% |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03 | Monorepo migration (Turborepo + pnpm) | Unified CI, shared lockfile, easier cross-app changes |
| 2026-03 | Next.js 15.5.12 upgrade | Security vulnerability in 15.3.5 and 15.4.6 |
| 2026-03 | Landing security hardening | Removed debug pages, added security headers |
| 2026-03 | No shared packages yet | Admin (shadcn/web) and app (NativeWind/RN) have fundamentally different UI stacks |
| 2026-03 | Android launch prioritized over new features | Can't grow without Play Store presence |
