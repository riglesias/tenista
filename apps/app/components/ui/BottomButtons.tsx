'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import React from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';

interface BottomButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  loading?: boolean;
  disabled?: boolean;
  cancelText?: string;
  saveText?: string;
  loadingText?: string;
}

export default function BottomButtons({
  onCancel,
  onSave,
  loading = false,
  disabled = false,
  cancelText = 'Cancel',
  saveText = 'Save Changes',
  loadingText = 'Saving...'
}: BottomButtonsProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View 
      className={`flex-row gap-3 px-6 py-4 ${Platform.OS === 'ios' ? 'pb-4' : ''}`}
      style={{ 
        backgroundColor: colors.background, 
        borderTopColor: colors.border 
      }}
    >
      <TouchableOpacity
        onPress={onCancel}
        className="flex-1 py-4 rounded-xl items-center border"
        style={{ 
          backgroundColor: colors.secondary, 
          borderColor: colors.border 
        }}
        activeOpacity={0.7}
        disabled={loading}
      >
        <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
          {cancelText}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSave}
        className={`flex-1 py-4 rounded-xl items-center ${loading || disabled ? 'opacity-60' : ''}`}
        style={{ backgroundColor: colors.primary }}
        activeOpacity={0.7}
        disabled={loading || disabled}
      >
        {loading ? (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color={colors.primaryForeground} />
            <Text className="text-base font-semibold ml-2" style={{ color: colors.primaryForeground }}>
              {loadingText}
            </Text>
          </View>
        ) : (
          <Text className="text-base font-semibold" style={{ color: colors.primaryForeground }}>
            {saveText}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
} 