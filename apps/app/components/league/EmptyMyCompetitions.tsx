'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Trophy } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'

interface EmptyMyCompetitionsProps {
  onDiscoverPress: () => void
}

export default function EmptyMyCompetitions({
  onDiscoverPress,
}: EmptyMyCompetitionsProps) {
  const { theme } = useTheme()
  const { t } = useTranslation('league')

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.muted },
        ]}
      >
        <Trophy size={48} color={theme.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: theme.foreground }]}>
        {t('empty.noCompetitions')}
      </Text>
      <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
        {t('empty.noCompetitionsSubtitle')}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={onDiscoverPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('empty.browseCompetitions')}
      >
        <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>
          {t('empty.browseCompetitions')}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
