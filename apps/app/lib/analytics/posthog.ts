import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  disabled: !POSTHOG_API_KEY,
});

/**
 * Fire-and-forget analytics track — safe to call anywhere.
 * Silently no-ops if PostHog is not configured.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_API_KEY) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Never let analytics crash the app
  }
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_API_KEY) return;
  try {
    posthog.identify(userId, properties);
  } catch {}
}

export function reset() {
  if (!POSTHOG_API_KEY) return;
  try {
    posthog.reset();
  } catch {}
}
