'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { UserLeague } from '@/lib/validation/leagues.validation'
import React from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface LeagueTabsProps {
  userLeagues: UserLeague[]
  selectedLeague: UserLeague
  onLeagueSwitch: (league: UserLeague) => void
}

export default function LeagueTabs({
  userLeagues,
  selectedLeague,
  onLeagueSwitch,
}: LeagueTabsProps) {
  const { theme } = useTheme()

  if (userLeagues.length <= 1) {
    return null
  }

  const renderItem = ({ item }: { item: UserLeague }) => {
    const isSelected = selectedLeague.league.id === item.league.id
    return (
      <TouchableOpacity
        onPress={() => onLeagueSwitch(item)}
        style={[
          styles.tab,
          {
            backgroundColor: isSelected ? theme.primary : theme.card,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
        accessibilityRole="tab"
        accessibilityLabel={`Select league ${item.league.name}`}
        accessibilityState={{ selected: isSelected }}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: isSelected
                ? theme.primaryForeground
                : theme.foreground,
            },
          ]}
        >
          {item.league.name}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userLeagues}
        renderItem={renderItem}
        keyExtractor={(item) => item.league.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  listContent: {
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}) 