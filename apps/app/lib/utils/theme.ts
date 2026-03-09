/**
 * Theme utilities for React Native compatible colors
 * These values match the CSS custom properties in global.css
 */

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    fontFamily: 'Lato_700Bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    fontFamily: 'Lato_700Bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'Lato_700Bold',
  },
  body: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  light: {
    fontFamily: 'Lato_300Light',
  },
  regular: {
    fontFamily: 'Lato_400Regular',
  },
  bold: {
    fontFamily: 'Lato_700Bold',
  },
};

export const lightTheme = {
  // Main background and foreground
  background: 'rgb(255, 255, 255)', // --color-background-0
  foreground: 'rgb(17, 24, 39)', // --color-foreground

  // Card colors
  card: 'rgb(255, 255, 255)', // --color-background-0
  cardForeground: 'rgb(17, 24, 39)', // --color-foreground

  // Primary colors
  primary: 'rgb(59, 130, 246)', // --color-primary-500
  primaryForeground: 'rgb(255, 255, 255)', // --color-primary-foreground

  // Secondary colors
  secondary: 'rgb(243, 244, 246)', // --color-background-100
  secondaryForeground: 'rgb(17, 24, 39)', // --color-foreground

  // Muted colors
  muted: 'rgb(243, 244, 246)', // --color-background-100
  mutedForeground: 'rgb(107, 114, 128)', // --color-muted

  // Accent colors
  accent: 'rgb(243, 244, 246)', // --color-background-100
  accentForeground: 'rgb(17, 24, 39)', // --color-foreground

  // Destructive colors
  destructive: '#EF4444',
  destructiveForeground: 'rgb(255, 255, 255)',

  // Success colors
  success: 'rgb(34, 197, 94)', // green
  successForeground: 'rgb(255, 255, 255)',

  // Warning colors
  warning: 'rgb(245, 158, 11)', // amber
  warningForeground: 'rgb(255, 255, 255)',

  // Info colors
  info: 'rgb(99, 102, 241)', // indigo
  infoForeground: 'rgb(255, 255, 255)',

  // Border and input
  border: 'rgb(229, 231, 235)', // --color-background-200
  input: 'rgb(229, 231, 235)', // --color-background-200
  ring: 'rgb(147, 197, 253)', // --color-primary-300
  
  spacing,
  typography,
};

export const darkTheme = {
  // Main background and foreground
  background: 'rgb(3, 7, 18)', // --color-background-0 (dark)
  foreground: 'rgb(249, 250, 251)', // --color-foreground (dark)

  // Card colors
  card: 'rgb(17, 24, 39)', // --color-background-50 (dark)
  cardForeground: 'rgb(249, 250, 251)', // --color-foreground (dark)

  // Primary colors
  primary: 'rgb(132, 254, 12)', // --color-primary-500 (bright green)
  primaryForeground: 'rgb(17, 24, 39)', // --color-primary-foreground (dark)

  // Secondary colors
  secondary: 'rgb(31, 41, 55)', // --color-background-100 (dark)
  secondaryForeground: 'rgb(249, 250, 251)', // --color-foreground (dark)

  // Muted colors
  muted: 'rgb(31, 41, 55)', // --color-background-100 (dark)
  mutedForeground: 'rgb(156, 163, 175)', // --color-muted (dark)

  // Accent colors
  accent: 'rgb(55, 65, 81)', // --color-background-200 (dark)
  accentForeground: 'rgb(249, 250, 251)', // --color-foreground (dark)
  
  // Destructive colors
  destructive: '#EF4444',
  destructiveForeground: 'rgb(255, 255, 255)',

  // Success colors
  success: 'rgb(34, 197, 94)', // green
  successForeground: 'rgb(255, 255, 255)',

  // Warning colors
  warning: 'rgb(245, 158, 11)', // amber
  warningForeground: 'rgb(255, 255, 255)',

  // Info colors
  info: 'rgb(99, 102, 241)', // indigo
  infoForeground: 'rgb(255, 255, 255)',

  // Border and input
  border: 'rgb(55, 65, 81)', // --color-background-200 (dark)
  input: 'rgb(17, 24, 39)', // Same as card background (#121827)
  ring: 'rgb(132, 254, 12)', // --color-primary-500 (bright green)
  
  spacing,
  typography,
};

export function getThemeColors(isDark: boolean) {
  return isDark ? darkTheme : lightTheme;
} 