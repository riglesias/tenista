import { Tabs } from 'expo-router';
import { BarChart3, Settings, Trophy, Users } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation('common');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 80,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 15 : 10,
          paddingTop: 10,
          paddingHorizontal: 16,
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community'),
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="league"
        options={{
          title: t('tabs.league'),
          tabBarIcon: ({ color }) => <Trophy size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: t('tabs.results'),
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
