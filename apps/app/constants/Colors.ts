/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#84cc16'; // lime-500
const tintColorDark = '#84cc16'; // lime-500

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    cardBackground: '#f9fafb',
    border: '#e5e7eb',
    primary: '#5046e5',
    secondary: '#6b7280',
    surface: '#ffffff',
    accent: '#84cc16',
  },
  dark: {
    text: '#fff',
    background: '#1a1a2e',
    tint: tintColorDark,
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorDark,
    cardBackground: '#1f2937',
    border: '#374151',
    primary: '#5046e5',
    secondary: '#9ca3af',
    surface: '#1f2937',
    accent: '#84cc16',
  },
};
