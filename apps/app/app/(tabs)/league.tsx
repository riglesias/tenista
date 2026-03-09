'use client'

import CurrentLeague from '@/components/league/CurrentLeague'
import EmptyMyCompetitions from '@/components/league/EmptyMyCompetitions'
import LeagueLoading from '@/components/league/LeagueLoading'
import LeagueMenu from '@/components/league/LeagueMenu'
import LeagueSelection from '@/components/league/LeagueSelection'
import LeagueTabs from '@/components/league/LeagueTabs'
import ErrorMessage from '@/components/ui/ErrorMessage'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { useTheme } from '@/contexts/ThemeContext'
import { useLeagues } from '@/hooks/useLeagues'
import { usePlayerChallengesRealtimeSubscription } from '@/hooks/useLadderRealtime'
import { getThemeColors } from '@/lib/utils/theme'
import { MoreVertical } from 'lucide-react-native'
import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'

export default function LeagueScreen() {
  const { theme, isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')
  const {
    currentPlayer,
    userLeagues,
    availableLeagues,
    selectedLeague,
    setSelectedLeague,
    loading,
    error,
    refresh,
  } = useLeagues()

  // Subscribe to realtime updates for all challenges involving this player
  usePlayerChallengesRealtimeSubscription(currentPlayer?.id || null)

  const [showMenu, setShowMenu] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'my' | 'discover'>('my')

  // Default to appropriate tab based on user's leagues
  useEffect(() => {
    if (userLeagues.length === 0) {
      setSelectedTab('discover')
    }
  }, [userLeagues.length])

  // Close menu if selectedLeague becomes null (e.g., during data refetch after city change)
  useEffect(() => {
    if (showMenu && !selectedLeague) {
      setShowMenu(false)
    }
  }, [showMenu, selectedLeague])

  // Get joined league IDs for filtering in Discover tab
  const joinedLeagueIds = userLeagues.map(ul => ul.league.id)

  if (loading && !userLeagues.length && !availableLeagues.length) {
    return <LeagueLoading />
  }

  if (error) {
    return (
      <ErrorMessage
        title={t('errors.loadError')}
        message={t('errors.loadErrorMessage')}
        onRetry={refresh}
        retryText={t('errors.tryAgain')}
        variant="default"
      />
    )
  }

  const renderLeagueTabs = () => (
    <LeagueTabs
      userLeagues={userLeagues}
      selectedLeague={selectedLeague!}
      onLeagueSwitch={setSelectedLeague}
    />
  )

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: 24 }]}>
        <Text style={[theme.typography.h2, { color: colors.foreground }]}>
          {t('title')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={[
            styles.menuButton,
            !(selectedTab === 'my' && userLeagues.length > 0 && selectedLeague) && styles.menuButtonHidden,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('menu.openMenu')}
          disabled={!(selectedTab === 'my' && userLeagues.length > 0 && selectedLeague)}
        >
          <MoreVertical size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {showMenu && selectedLeague && (
        <LeagueMenu
          visible={showMenu}
          onClose={() => setShowMenu(false)}
          leagueId={selectedLeague.league.id}
          playerId={currentPlayer?.id || null}
          onLeagueLeft={refresh}
        />
      )}

      <View style={styles.segmentedControlContainer}>
        <SegmentedControl
          segments={[t('tabs.myCompetitions'), t('tabs.discover')]}
          selectedIndex={selectedTab === 'my' ? 0 : 1}
          onChange={(index) => setSelectedTab(index === 0 ? 'my' : 'discover')}
        />
      </View>

      {selectedTab === 'my' ? (
        userLeagues.length > 0 && selectedLeague ? (
          <CurrentLeague
            selectedLeague={selectedLeague}
            currentPlayerId={currentPlayer?.id || null}
            ListHeaderComponent={renderLeagueTabs()}
            onRefresh={refresh}
            refreshing={loading}
          />
        ) : (
          <EmptyMyCompetitions onDiscoverPress={() => setSelectedTab('discover')} />
        )
      ) : (
        <LeagueSelection
          availableLeagues={availableLeagues}
          currentPlayer={currentPlayer}
          onLeagueJoined={refresh}
          joinedLeagueIds={joinedLeagueIds}
        />
      )}
    </View>
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
    paddingTop: 64,
    paddingBottom: 16,
  },
  segmentedControlContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    // styles from typography token
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  menuButtonHidden: {
    opacity: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
})