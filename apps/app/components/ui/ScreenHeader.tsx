'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function ScreenHeader({ 
  title, 
  onBack, 
  showBackButton = true 
}: ScreenHeaderProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View 
      className={`px-6 py-4 ${Platform.OS === 'android' ? 'pt-6' : ''}`} 
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-row items-center justify-center relative">
        {showBackButton && onBack && (
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 rounded-full items-center justify-center absolute left-0"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
          {title}
        </Text>
      </View>
    </View>
  );
} 