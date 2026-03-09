'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Frown } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

interface EmptyDiscoverStateProps {
  variant: 'all-joined' | 'no-leagues'
}

export default function EmptyDiscoverState({
  variant,
}: EmptyDiscoverStateProps) {
  const { theme } = useTheme()
  const { t } = useTranslation('league')

  const isAllJoined = variant === 'all-joined'

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.muted },
        ]}
      >
        <Frown size={48} color={theme.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: theme.foreground }]}>
        {isAllJoined
          ? t('selection.allLeaguesJoined')
          : t('selection.noLeaguesAvailable')}
      </Text>
      <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
        {isAllJoined
          ? t('selection.checkMyCompetitions')
          : t('selection.checkBackSoon')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
