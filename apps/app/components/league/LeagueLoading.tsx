'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Skeleton } from '@/components/ui/LoadingSpinner'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function LeagueLoading() {
  const { theme } = useTheme()

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.innerContainer, { paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.m }]}>
        {/* Header */}
        <View style={[styles.header, { paddingBottom: theme.spacing.m }]}>
          <Skeleton width={120} height={28} borderRadius={8} />
          <Skeleton width={24} height={24} borderRadius={8} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { paddingBottom: theme.spacing.m }]}>
          <Skeleton
            width={120}
            height={42}
            borderRadius={8}
            style={{ marginRight: theme.spacing.s }}
          />
          <Skeleton width={120} height={42} borderRadius={8} />
        </View>

        {/* Info Card */}
        <View style={[styles.card, { marginBottom: theme.spacing.m, padding: theme.spacing.m }]}>
          <View style={[styles.cardHeader, { marginBottom: theme.spacing.m }]}>
            <Skeleton width={150} height={20} borderRadius={8} />
            <Skeleton width={80} height={24} borderRadius={6} />
          </View>
          <View style={styles.statsRow}>
            <Skeleton width={80} height={30} borderRadius={8} />
            <Skeleton width={60} height={30} borderRadius={8} />
            <Skeleton width={70} height={30} borderRadius={8} />
          </View>
        </View>

        {/* Standings */}
        <View style={[styles.standingsContainer, { paddingBottom: theme.spacing.l }]}>
          <Skeleton
            width={180}
            height={20}
            borderRadius={8}
            style={{ marginBottom: theme.spacing.m }}
          />
          <Skeleton
            width="100%"
            height={40}
            borderRadius={8}
            style={{ marginBottom: theme.spacing.xs }}
          />
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              width="100%"
              height={50}
              borderRadius={8}
              style={{ marginBottom: theme.spacing.xs }}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    //
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  standingsContainer: {
    //
  },
}) 