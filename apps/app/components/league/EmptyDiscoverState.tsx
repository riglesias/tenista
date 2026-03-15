'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  getNewLeagueNotificationPreference,
  toggleNewLeagueNotification,
} from '@/lib/actions/notifications.actions'
import { Bell, BellRing, Frown } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'

interface EmptyDiscoverStateProps {
  variant: 'all-joined' | 'no-leagues'
}

export default function EmptyDiscoverState({
  variant,
}: EmptyDiscoverStateProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const { t } = useTranslation('league')
  const [notifyEnabled, setNotifyEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  const isAllJoined = variant === 'all-joined'
  const showNotifyButton = !isAllJoined && !!user

  useEffect(() => {
    if (!showNotifyButton || !user) return
    getNewLeagueNotificationPreference(user.id).then(setNotifyEnabled)
  }, [showNotifyButton, user])

  const handleToggleNotify = useCallback(async () => {
    if (!user || loading) return
    setLoading(true)
    try {
      const newValue = !notifyEnabled
      await toggleNewLeagueNotification(user.id, newValue)
      setNotifyEnabled(newValue)
    } catch {
      // silently handled
    } finally {
      setLoading(false)
    }
  }, [user, notifyEnabled, loading])

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

      {showNotifyButton && (
        <TouchableOpacity
          onPress={handleToggleNotify}
          disabled={loading}
          activeOpacity={0.7}
          style={[
            styles.notifyButton,
            {
              backgroundColor: notifyEnabled ? theme.muted : theme.primary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={notifyEnabled ? theme.foreground : theme.primaryForeground}
            />
          ) : notifyEnabled ? (
            <>
              <BellRing size={18} color={theme.foreground} />
              <Text style={[styles.notifyText, { color: theme.foreground }]}>
                {t('selection.notificationsOn')}
              </Text>
            </>
          ) : (
            <>
              <Bell size={18} color={theme.primaryForeground} />
              <Text style={[styles.notifyText, { color: theme.primaryForeground }]}>
                {t('selection.notifyMe')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
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
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 180,
  },
  notifyText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
