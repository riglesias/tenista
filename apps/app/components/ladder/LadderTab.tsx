'use client'

import React, { useState, useCallback } from 'react'
import { ActivityIndicator, Text, View, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { UserLeague, DEFAULT_LADDER_CONFIG, LadderConfig } from '@/lib/validation/leagues.validation'
import {
  shouldUseWhatsApp,
  formatPhoneForWhatsApp,
  buildWhatsAppUrl,
  buildSmsUrl,
} from '@/lib/utils/messaging'
import { getPlayerById } from '@/lib/actions/player.actions'
import { LadderRankingWithPlayer } from '@/lib/validation/ladder.validation'
import {
  useLadderRankings,
  useActiveChallenge,
  usePendingChallenges,
  usePlayerLadderPosition,
  useCreateChallenge,
  useAcceptChallenge,
  useDeclineChallenge,
  useCancelChallenge,
  useChallengeHistory,
  useReportMatchResult,
  useRefreshLadderData,
} from '@/hooks/useLadder'
import { useLadderRealtimeSubscription } from '@/hooks/useLadderRealtime'
import { usePlayerTeamInLeague } from '@/hooks/useDoublesTeam'
import LadderRankingsTable from './LadderRankingsTable'
import PendingChallengesSection from './PendingChallengesSection'
import ChallengeConfirmationSheet from './ChallengeConfirmationSheet'
import ReportResultDialog from './ReportResultDialog'
import DoublesTeamPrompt from '../doubles/DoublesTeamPrompt'
import ChallengeCard from './ChallengeCard'
import { Swords } from 'lucide-react-native'

type LadderSubTab = 'ranking' | 'challenges'

// Helper function to translate challenge error messages
function getChallengeErrorTranslation(reason: string, t: (key: string, options?: any) => string): string {
  // Map server reason strings to translation keys
  if (reason.includes('You already have an active challenge')) {
    return t('detail.youHaveActiveChallenge')
  }
  if (reason.includes('This player already has an active challenge')) {
    return t('detail.playerHasActiveChallenge')
  }
  if (reason.includes('only challenge players ranked above')) {
    return t('detail.canOnlyChallengeAbove')
  }
  if (reason.includes('only challenge up to')) {
    const match = reason.match(/up to (\d+) positions/)
    const positions = match ? match[1] : '3'
    return t('detail.maxChallengePositions', { positions })
  }
  if (reason.includes('respond to your pending challenge')) {
    return t('detail.mustRespondFirst')
  }
  if (reason.includes('must wait') && reason.includes('days before challenging')) {
    const match = reason.match(/wait (\d+) days/)
    const days = match ? match[1] : '7'
    return t('detail.rechallengeCooldownWait', { days })
  }
  if (reason.includes('not in this ladder')) {
    return t('detail.notInLadder')
  }
  if (reason.includes('not a ladder competition')) {
    return t('detail.notLadderCompetition')
  }
  if (reason.includes('retired') && reason.includes('cannot be challenged')) {
    return t('detail.playerRetired')
  }
  // Fallback to original reason
  return reason
}

interface LadderTabProps {
  selectedLeague: UserLeague
  currentPlayerId: string | null
  onRefresh: () => void
  refreshing: boolean
  isReadOnly?: boolean
}

export default function LadderTab({
  selectedLeague,
  currentPlayerId,
  onRefresh,
  refreshing,
  isReadOnly,
}: LadderTabProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')
  const leagueId = selectedLeague.league.id
  const isDoublesLeague = selectedLeague.league.participant_type === 'doubles'
  const ladderConfig: LadderConfig = selectedLeague.league.ladder_config || DEFAULT_LADDER_CONFIG

  // State
  const [activeSubTab, setActiveSubTab] = useState<LadderSubTab>('ranking')
  const [showChallengeSheet, setShowChallengeSheet] = useState(false)
  const [selectedOpponent, setSelectedOpponent] = useState<LadderRankingWithPlayer | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportMatchId, setReportMatchId] = useState<string | null>(null)
  const [showAllPast, setShowAllPast] = useState(false)

  // Queries
  const { data: rankings = [], isLoading: loadingRankings } = useLadderRankings(leagueId)
  const { data: playerPosition } = usePlayerLadderPosition(leagueId, currentPlayerId)
  const { data: activeChallenge } = useActiveChallenge(leagueId, currentPlayerId)
  const { data: pendingChallenges = [] } = usePendingChallenges(currentPlayerId)

  const { data: challengeHistory = [] } = useChallengeHistory(leagueId, currentPlayerId || undefined, 10)

  // Realtime subscription for challenge updates
  useLadderRealtimeSubscription(leagueId, currentPlayerId)

  // For doubles leagues, check if player has a team
  const { data: playerTeam, isLoading: loadingTeam } = usePlayerTeamInLeague(
    leagueId,
    isDoublesLeague ? currentPlayerId : null
  )

  // Mutations
  const createChallengeMutation = useCreateChallenge()
  const acceptChallengeMutation = useAcceptChallenge()
  const declineChallengeMutation = useDeclineChallenge()
  const cancelChallengeMutation = useCancelChallenge()
  const reportMatchMutation = useReportMatchResult()
  const refreshLadderData = useRefreshLadderData()

  // Filter pending challenges to only show ones for this league
  const leaguePendingChallenges = pendingChallenges.filter(
    (c) => c.league_id === leagueId && c.status === 'pending'
  )

  // Get outgoing challenge for this league
  const outgoingChallenge = activeChallenge?.challenger_player_id === currentPlayerId
    ? activeChallenge
    : null

  // Get accepted incoming challenge (challenged player accepted, needs to record match)
  const acceptedIncomingChallenge =
    activeChallenge?.challenged_player_id === currentPlayerId &&
    activeChallenge?.status === 'accepted' &&
    activeChallenge?.league_id === leagueId
      ? activeChallenge
      : null

  // Check if player has an active challenge (incoming or outgoing)
  const hasActiveChallenge = activeChallenge !== null

  // Handle challenge button press
  const handleChallengePress = useCallback((position: number) => {
    const opponent = rankings.find((r) => r.position === position)
    if (opponent) {
      setSelectedOpponent(opponent)
      setShowChallengeSheet(true)
    }
  }, [rankings])

  // Confirm and send challenge
  const handleConfirmChallenge = useCallback(async () => {
    if (!selectedOpponent) return

    try {
      await createChallengeMutation.mutateAsync({
        leagueId,
        challengedPosition: selectedOpponent.position,
      })
      setShowChallengeSheet(false)
      setSelectedOpponent(null)
      Alert.alert(t('alerts.challengeSent'), t('alerts.challengeSentMessage'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('alerts.failedToSendChallenge')
      Alert.alert(t('alerts.error'), getChallengeErrorTranslation(errorMessage, t))
    }
  }, [selectedOpponent, leagueId, createChallengeMutation, t])

  // Accept challenge
  const handleAcceptChallenge = useCallback(async (challengeId: string) => {
    Alert.alert(
      t('alerts.acceptChallenge'),
      t('alerts.confirmAcceptChallenge'),
      [
        { text: t('alerts.cancel'), style: 'cancel' },
        {
          text: t('alerts.accept'),
          onPress: async () => {
            try {
              await acceptChallengeMutation.mutateAsync({ challengeId, leagueId })
              Alert.alert(t('alerts.challengeAccepted'), t('alerts.challengeAcceptedMessage'))
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : t('alerts.failedToAcceptChallenge')
              Alert.alert(t('alerts.error'), getChallengeErrorTranslation(errorMessage, t))
            }
          },
        },
      ]
    )
  }, [leagueId, acceptChallengeMutation, t])

  // Decline challenge
  const handleDeclineChallenge = useCallback(async (challengeId: string) => {
    Alert.alert(
      t('alerts.declineChallenge'),
      t('alerts.confirmDeclineChallenge'),
      [
        { text: t('alerts.cancel'), style: 'cancel' },
        {
          text: t('alerts.decline'),
          style: 'destructive',
          onPress: async () => {
            try {
              await declineChallengeMutation.mutateAsync({ challengeId, leagueId })
              Alert.alert(t('alerts.challengeDeclined'), t('alerts.challengeDeclinedMessage'))
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : t('alerts.failedToDeclineChallenge')
              Alert.alert(t('alerts.error'), getChallengeErrorTranslation(errorMessage, t))
            }
          },
        },
      ]
    )
  }, [leagueId, declineChallengeMutation, t])

  // Cancel challenge (only for outgoing pending challenges)
  const handleCancelChallenge = useCallback(async (challengeId: string) => {
    Alert.alert(
      t('alerts.cancelChallenge'),
      t('alerts.confirmCancelChallenge'),
      [
        { text: t('alerts.no'), style: 'cancel' },
        {
          text: t('alerts.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelChallengeMutation.mutateAsync({ challengeId, leagueId })
              Alert.alert(t('alerts.challengeCancelled'), t('alerts.challengeCancelledMessage'))
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : t('alerts.failedToCancelChallenge')
              Alert.alert(t('alerts.error'), getChallengeErrorTranslation(errorMessage, t))
            }
          },
        },
      ]
    )
  }, [leagueId, cancelChallengeMutation, t])

  // Record match (navigate to match recording screen)
  const handleRecordMatch = useCallback((challengeId: string) => {
    // Navigate to match recording screen with challenge context
    router.push({
      pathname: '/submit-result',
      params: { challengeId, leagueId }
    })
  }, [leagueId])

  // Handle player press (navigate to profile with ladder context)
  const handlePlayerPress = useCallback((playerId: string) => {
    router.push({
      pathname: '/player-profile',
      params: {
        playerId,
        leagueId,
        fromLadder: 'true'
      }
    })
  }, [leagueId])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshLadderData(leagueId, currentPlayerId || undefined)
    onRefresh()
  }, [leagueId, currentPlayerId, refreshLadderData, onRefresh])

  // Handle message player
  const handleMessagePlayer = useCallback(async (playerId: string) => {
    try {
      const { data: player, error } = await getPlayerById(playerId)
      if (error || !player) {
        Alert.alert(t('errors.loadError'), t('errors.loadErrorMessage'))
        return
      }

      if (!player.phone_number) {
        Alert.alert(
          t('errors.loadError'),
          'This player has not added their phone number.'
        )
        return
      }

      // Determine messaging method based on country
      if (shouldUseWhatsApp(player.country_code)) {
        const formattedPhone = formatPhoneForWhatsApp(
          player.phone_country_code,
          player.phone_number
        )
        if (formattedPhone) {
          const whatsappUrl = buildWhatsAppUrl(formattedPhone)
          const supported = await Linking.canOpenURL(whatsappUrl)
          if (supported) {
            await Linking.openURL(whatsappUrl)
            return
          }
        }
      }

      // Fallback to SMS
      const phoneNumber = player.phone_country_code
        ? `${player.phone_country_code}${player.phone_number}`
        : player.phone_number
      const smsUrl = buildSmsUrl(phoneNumber)
      const supported = await Linking.canOpenURL(smsUrl)
      if (supported) {
        await Linking.openURL(smsUrl)
      } else {
        Alert.alert(t('errors.loadError'), 'Unable to open messaging app.')
      }
    } catch (error) {
      console.error('Error messaging player:', error)
      Alert.alert(t('errors.loadError'), t('errors.loadErrorMessage'))
    }
  }, [t])

  // Handle edit result (navigate to submit-result in edit mode)
  const handleEditResult = useCallback((challengeId: string, playerMatchId: string) => {
    router.push({
      pathname: '/submit-result',
      params: { challengeId, leagueId, editMatchId: playerMatchId, editMode: 'true' }
    })
  }, [leagueId])

  // Handle report result
  const handleReportResult = useCallback((playerMatchId: string) => {
    setReportMatchId(playerMatchId)
    setShowReportDialog(true)
  }, [])

  const handleSubmitReport = useCallback(async (reason: string) => {
    if (!reportMatchId) return
    try {
      await reportMatchMutation.mutateAsync({ playerMatchId: reportMatchId, reason })
      setShowReportDialog(false)
      setReportMatchId(null)
      Alert.alert(t('detail.reportSubmitted'))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report'
      Alert.alert(t('alerts.error'), errorMessage)
    }
  }, [reportMatchId, reportMatchMutation, t])

  // Filter completed challenges for "Recent" section
  const recentCompletedChallenges = challengeHistory.filter(c => c.status === 'completed')

  // Loading state
  if (loadingRankings || (isDoublesLeague && loadingTeam)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // For doubles leagues, show team prompt if no team
  if (isDoublesLeague && !playerTeam && currentPlayerId) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <DoublesTeamPrompt
          leagueId={leagueId}
          currentPlayerId={currentPlayerId}
          onTeamCreated={handleRefresh}
        />
      </ScrollView>
    )
  }

  // Count challenges that need attention
  const challengeCount = leaguePendingChallenges.length + (outgoingChallenge ? 1 : 0) + (acceptedIncomingChallenge ? 1 : 0)
  const hasNewChallenges = leaguePendingChallenges.length > 0

  // Tab bar component
  const TabBar = (
    <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.muted,
          borderRadius: 8,
          padding: 4,
        }}
      >
        {/* Ranking Tab */}
        <TouchableOpacity
          onPress={() => setActiveSubTab('ranking')}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: activeSubTab === 'ranking' ? colors.background : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSubTab === 'ranking' }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: activeSubTab === 'ranking' ? '600' : '500',
              color: activeSubTab === 'ranking' ? colors.foreground : colors.mutedForeground,
            }}
          >
            {t('tabs.ranking')}
          </Text>
        </TouchableOpacity>

        {/* Challenges Tab */}
        <TouchableOpacity
          onPress={() => setActiveSubTab('challenges')}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: activeSubTab === 'challenges' ? colors.background : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeSubTab === 'challenges' }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: activeSubTab === 'challenges' ? '600' : '500',
              color: activeSubTab === 'challenges' ? colors.foreground : colors.mutedForeground,
            }}
          >
            {t('tabs.challenges')}
          </Text>
          {/* Notification dot for new challenges */}
          {hasNewChallenges && activeSubTab !== 'challenges' && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.destructive,
                marginLeft: 6,
              }}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  // Ranking tab header
  const RankingListHeader = (
    <View>
      {TabBar}
    </View>
  )

  // Challenges tab content
  const ChallengesContent = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      {TabBar}
      {challengeCount > 0 ? (
        <PendingChallengesSection
          incomingChallenges={leaguePendingChallenges}
          outgoingChallenge={outgoingChallenge}
          acceptedIncomingChallenge={acceptedIncomingChallenge}
          currentPlayerId={currentPlayerId}
          onAccept={handleAcceptChallenge}
          onDecline={handleDeclineChallenge}
          onCancel={handleCancelChallenge}
          onRecordMatch={handleRecordMatch}
          onMessage={handleMessagePlayer}
        />
      ) : (
        <View style={{
          paddingHorizontal: 24,
          paddingTop: 16,
        }}>
          <View style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
          }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Swords size={28} color={colors.mutedForeground} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {t('detail.noChallenges')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                textAlign: 'center',
              }}
            >
              {t('detail.noChallengesDescription')}
            </Text>
          </View>
        </View>
      )}

      {/* Recent completed challenges */}
      {recentCompletedChallenges.length > 0 && (
        <View style={{ paddingHorizontal: 24, marginTop: challengeCount > 0 ? 8 : 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            {t('detail.recentChallenges')}
          </Text>
          {(showAllPast ? recentCompletedChallenges : recentCompletedChallenges.slice(0, 3)).map((challenge) => {
            const isSubmitter = challenge.player_match?.submitted_by === currentPlayerId
            const canEdit = isSubmitter && (challenge.player_match?.edit_count ?? 0) === 0
            const canReport = !isSubmitter && !!challenge.player_match_id

            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentPlayerId={currentPlayerId}
                onEditResult={canEdit && challenge.player_match_id ? () => handleEditResult(challenge.id, challenge.player_match_id!) : undefined}
                onReportResult={canReport && challenge.player_match_id ? () => handleReportResult(challenge.player_match_id!) : undefined}
              />
            )
          })}
          {!showAllPast && recentCompletedChallenges.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAllPast(true)}
              style={{
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.primary,
                }}
              >
                {t('detail.seeMore')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  )

  // In read-only mode, only show ranking (no challenges tab)
  if (isReadOnly) {
    return (
      <View style={{ flex: 1 }}>
        <LadderRankingsTable
          rankings={rankings}
          currentPlayerId={currentPlayerId}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onPlayerPress={handlePlayerPress}
          isDoublesLeague={isDoublesLeague}
        />
      </View>
    )
  }

  // Render challenges tab
  if (activeSubTab === 'challenges') {
    return (
      <View style={{ flex: 1 }}>
        {ChallengesContent}
        <ReportResultDialog
          visible={showReportDialog}
          onClose={() => { setShowReportDialog(false); setReportMatchId(null) }}
          onSubmit={handleSubmitReport}
          loading={reportMatchMutation.isPending}
        />
      </View>
    )
  }

  // Render ranking tab (default)
  return (
    <View style={{ flex: 1 }}>
      <LadderRankingsTable
        rankings={rankings}
        currentPlayerId={currentPlayerId}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onPlayerPress={handlePlayerPress}
        ListHeaderComponent={RankingListHeader}
        isDoublesLeague={isDoublesLeague}
      />

      {/* Challenge confirmation sheet */}
      <ChallengeConfirmationSheet
        visible={showChallengeSheet}
        onClose={() => {
          setShowChallengeSheet(false)
          setSelectedOpponent(null)
        }}
        opponent={selectedOpponent}
        currentPlayerPosition={playerPosition ?? null}
        ladderConfig={ladderConfig}
        onConfirm={handleConfirmChallenge}
        isLoading={createChallengeMutation.isPending}
        isDoublesLeague={isDoublesLeague}
      />
    </View>
  )
}
