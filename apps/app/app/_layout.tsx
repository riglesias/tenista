import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Lato_300Light, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthGuard from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { ConfirmDialogContainer } from '@/components/ui/ConfirmDialog';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Initialize i18n
import '@/lib/i18n';

// Initialize Sentry only in production with a valid DSN
if (process.env.NODE_ENV === 'production' && process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: false,
    tracesSampleRate: 1.0,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes for most data
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 3 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status
          if (status >= 400 && status < 500) return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus only for critical data
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Keep mutation state for 5 minutes for better UX
      gcTime: 5 * 60 * 1000,
    },
  },
});

function AppContent() {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="edit-availability" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="edit-location" options={{ headerShown: false }} />
        <Stack.Screen name="edit-flag" options={{ headerShown: false }} />
        <Stack.Screen name="edit-rating" options={{ headerShown: false }} />
        <Stack.Screen name="edit-club" options={{ headerShown: false }} />
        <Stack.Screen name="edit-homecourt" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ToastContainer />
      <ConfirmDialogContainer />
    </NavigationThemeProvider>
  );
}

function RootLayout() {
  const [loaded] = useFonts({
    Lato_300Light,
    Lato_400Regular,
    Lato_700Bold,
  });

  // Debug logging
  if (__DEV__) {
    console.log('[RootLayout] Starting app with env:', {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    });
  }

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function ThemedApp() {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <GluestackUIProvider mode={colorScheme}>
      <LanguageProvider>
        <ErrorBoundary
          onError={() => {
            // silently handled
          }}
          resetOnPropsChange={false}
        >
          <AuthProvider>
            <ErrorBoundary
              onError={() => {
                // silently handled
              }}
              resetKeys={[colorScheme]}
            >
              <NotificationProvider>
                <AuthGuard>
                  <ErrorBoundary
                    onError={() => {
                      // silently handled
                    }}
                    resetKeys={[colorScheme]}
                  >
                    <AppContent />
                  </ErrorBoundary>
                </AuthGuard>
              </NotificationProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </GluestackUIProvider>
  );
}

// Only wrap with Sentry in production
export default process.env.NODE_ENV === 'production' && process.env.EXPO_PUBLIC_SENTRY_DSN 
  ? Sentry.wrap(RootLayout) 
  : RootLayout;
