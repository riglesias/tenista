import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// Only construct PostHog when the API key is present — the constructor throws without one
export const posthog = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })
  : null;

/**
 * Fire-and-forget analytics track — safe to call anywhere.
 * Silently no-ops if PostHog is not configured.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  try {
    posthog?.capture(event, properties);
  } catch {
    // Never let analytics crash the app
  }
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  try {
    posthog?.identify(userId, properties);
  } catch {}
}

export function reset() {
  try {
    posthog?.reset();
  } catch {}
}
