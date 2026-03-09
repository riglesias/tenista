'use client'

import { useTheme } from '@/contexts/ThemeContext'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface SegmentedControlProps {
  segments: string[]
  selectedIndex: number
  onChange: (index: number) => void
}

export default function SegmentedControl({
  segments,
  selectedIndex,
  onChange,
}: SegmentedControlProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.muted }]}>
      {segments.map((segment, index) => {
        const isSelected = selectedIndex === index

        return (
          <Pressable
            key={segment}
            style={[
              styles.segment,
              isSelected && [styles.segmentSelected, { backgroundColor: theme.card }],
            ]}
            onPress={() => onChange(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={segment}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: isSelected ? theme.foreground : theme.mutedForeground,
                  fontWeight: isSelected ? '600' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {segment}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    textAlign: 'center',
  },
})
