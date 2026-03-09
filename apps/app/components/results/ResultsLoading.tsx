'use client'

import { useTheme } from '@/contexts/ThemeContext'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SkeletonPlaceholder = ({
  width,
  height,
  borderRadius = 4,
  style,
}: {
  width: number | string
  height: number
  borderRadius?: number
  style?: any
}) => {
  const { theme } = useTheme()
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.muted,
        },
        style,
      ]}
    />
  )
}

export default function ResultsLoading() {
  const { theme } = useTheme()

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <SkeletonPlaceholder width={160} height={28} borderRadius={8} />
        </View>

        {/* League Ranking Card */}
        <View
          style={[
            styles.rankingCard,
            {
              borderColor: theme.muted,
              marginTop: 16,
              marginBottom: 24,
              padding: 20,
            },
          ]}
        >
          <SkeletonPlaceholder
            width={140}
            height={14}
            borderRadius={6}
            style={{ marginBottom: 8 }}
          />
          <SkeletonPlaceholder
            width={180}
            height={12}
            borderRadius={6}
            style={{ marginBottom: 12 }}
          />
          <SkeletonPlaceholder width={80} height={48} borderRadius={8} />
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { marginBottom: 32 }]}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.statsCard,
                { borderColor: theme.muted, padding: 16 },
              ]}
            >
              <SkeletonPlaceholder
                width={20}
                height={20}
                borderRadius={10}
                style={{ marginBottom: 8 }}
              />
              <SkeletonPlaceholder
                width={36}
                height={24}
                borderRadius={6}
                style={{ marginBottom: 4 }}
              />
              <SkeletonPlaceholder width={48} height={10} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* Past Matches Title */}
        <SkeletonPlaceholder
          width={150}
          height={20}
          borderRadius={8}
          style={{ marginBottom: 16 }}
        />

        {/* Match Card Skeletons */}
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.matchCard,
              {
                borderColor: theme.muted,
                padding: 16,
                marginBottom: 12,
              },
            ]}
          >
            {/* Badge row (date + type) */}
            <View style={[styles.badgeRow, { marginBottom: 12 }]}>
              <SkeletonPlaceholder width={80} height={20} borderRadius={10} />
              <SkeletonPlaceholder
                width={60}
                height={20}
                borderRadius={10}
                style={{ marginLeft: 8 }}
              />
            </View>
            {/* Player rows */}
            {[0, 1].map((j) => (
              <View
                key={j}
                style={[styles.playerRow, { marginBottom: j === 0 ? 8 : 0 }]}
              >
                <View style={styles.playerInfo}>
                  <SkeletonPlaceholder width={20} height={14} borderRadius={3} />
                  <SkeletonPlaceholder
                    width={100}
                    height={14}
                    borderRadius={4}
                    style={{ marginLeft: 8 }}
                  />
                </View>
                <View style={styles.scoreBoxes}>
                  <SkeletonPlaceholder width={24} height={20} borderRadius={4} />
                  <SkeletonPlaceholder
                    width={24}
                    height={20}
                    borderRadius={4}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  rankingCard: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  matchCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBoxes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
