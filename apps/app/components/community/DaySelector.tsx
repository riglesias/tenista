'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export type DayOption = 'all' | 'today' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface DaySelectorProps {
  selectedDay: DayOption;
  onDaySelect: (day: DayOption) => void;
  dayOptions: { key: DayOption; label: string; isSeparator?: boolean }[];
}

export default function DaySelector({ selectedDay, onDaySelect, dayOptions }: DaySelectorProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View style={{ height: 40, marginBottom: 12 }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          gap: 8, 
          alignItems: 'center',
          minHeight: 40
        }}
      >
        {dayOptions.map((day, index) => {
          if (day.isSeparator) {
            return (
              <View key={`separator-${index}`} style={{ marginHorizontal: 8 }}>
                <Text style={{ 
                  color: colors.mutedForeground, 
                  fontSize: 18, 
                  fontWeight: '300' 
                }}>
                  {day.label}
                </Text>
              </View>
            );
          }

          const isSelected = selectedDay === day.key;
          
          return (
            <TouchableOpacity
              key={day.key}
              onPress={() => onDaySelect(day.key)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? colors.primary : colors.secondary,
                borderWidth: isSelected ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text 
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: isSelected ? colors.primaryForeground : colors.foreground,
                }}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
} 