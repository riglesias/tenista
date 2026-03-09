import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { View } from 'react-native';

// This is a shim for web and Android where the tab bar is generally opaque.
export default function TabBarBackground() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  return <View style={{ backgroundColor: colors.background, flex: 1 }} />;
}

export function useBottomTabOverflow() {
  return 0;
}
