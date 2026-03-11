import { track } from './posthog';

// ─── Event Names ─────────────────────────────────────────────────────────────

export const EVENTS = {
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LEAGUE_JOINED: 'league_joined',
  LEAGUE_LEFT: 'league_left',
  MATCH_SUBMITTED: 'match_submitted',
  CHALLENGE_SENT: 'challenge_sent',
  CHALLENGE_ACCEPTED: 'challenge_accepted',
  PLAY_NOW_REQUESTED: 'play_now_requested',
  COMMUNITY_FILTER_USED: 'community_filter_used',
  PLAYER_PROFILE_VIEWED: 'player_profile_viewed',
} as const;

// ─── Typed Track Helpers ──────────────────────────────────────────────────────

export function trackSignUp(method: 'email' | 'google' | 'apple') {
  track(EVENTS.SIGN_UP, { method });
}

export function trackLogin(method: 'email' | 'google' | 'apple') {
  track(EVENTS.LOGIN, { method });
}

export function trackLogout() {
  track(EVENTS.LOGOUT);
}

export function trackOnboardingComplete() {
  track(EVENTS.ONBOARDING_COMPLETE);
}

export function trackLeagueJoined(leagueId: string, leagueName?: string) {
  track(EVENTS.LEAGUE_JOINED, { league_id: leagueId, league_name: leagueName });
}

export function trackLeagueLeft(leagueId: string) {
  track(EVENTS.LEAGUE_LEFT, { league_id: leagueId });
}

export function trackMatchSubmitted(params: {
  leagueId?: string;
  winnerId?: string;
  score?: string;
}) {
  track(EVENTS.MATCH_SUBMITTED, {
    league_id: params.leagueId,
    winner_id: params.winnerId,
    score: params.score,
  });
}

export function trackChallengeSent(targetPlayerId: string) {
  track(EVENTS.CHALLENGE_SENT, { target_player_id: targetPlayerId });
}

export function trackChallengeAccepted(challengerId: string) {
  track(EVENTS.CHALLENGE_ACCEPTED, { challenger_id: challengerId });
}

export function trackPlayNowRequested(targetPlayerId: string) {
  track(EVENTS.PLAY_NOW_REQUESTED, { target_player_id: targetPlayerId });
}

export function trackCommunityFilterUsed(params: {
  ratingMin?: number;
  ratingMax?: number;
  availabilityFilter?: string;
}) {
  track(EVENTS.COMMUNITY_FILTER_USED, {
    rating_min: params.ratingMin,
    rating_max: params.ratingMax,
    availability_filter: params.availabilityFilter,
  });
}

export function trackPlayerProfileViewed(playerId: string) {
  track(EVENTS.PLAYER_PROFILE_VIEWED, { player_id: playerId });
}
