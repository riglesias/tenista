'use client'

import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RadioButtonProps {
  value: string;
  label: string;
  selected: boolean;
  onPress: (value: string) => void;
}

export function RadioButton({ value, label, selected, onPress }: RadioButtonProps) {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      className="flex-row items-center py-2"
      onPress={() => onPress(value)}
      activeOpacity={0.7}
    >
      <View 
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
          isDark 
            ? (selected ? 'border-blue-400' : 'border-gray-400')
            : (selected ? 'border-blue-600' : 'border-gray-500')
        }`}
      >
        {selected && (
          <View 
            className={`w-3 h-3 rounded-full ${
              isDark ? 'bg-blue-400' : 'bg-blue-600'
            }`}
          />
        )}
      </View>
      <Text 
        className={`text-lg ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
} 