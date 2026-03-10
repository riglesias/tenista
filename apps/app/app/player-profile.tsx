'use client'

import BottomButtons from '@/components/ui/BottomButtons'
import PlayerStats from '@/components/ui/PlayerStats'
import MatchCard from '@/components/ui/MatchCard'
import ScreenHeader from '@/components/ui/ScreenHeader'
import RatingBadge from '@/components/ui/RatingBadge'
import CountryFlag from '@/components/ui/CountryFlag'
import ChallengeConfirmationSheet from '@/components/ladder/ChallengeConfirmationSheet'
import { useAppToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTheme } from '@/contexts/ThemeContext'
import { getCourtById } from '@/lib/actions/courts.actions'
import { getPlayerStats, MatchData, PlayerStatsData } from '@/lib/actions/player-stats.actions'
import { getPlayerById, getPlayerProfile } from '@/lib/actions/player.actions'
import { getThemeColors } from '@/lib/utils/theme'
import {
  shouldUseWhatsApp,
  formatPhoneForWhatsApp,
  buildWhatsAppUrl,
  buildSmsUrl,
} from '@/lib/utils/messaging'
import { Ionicons } from '@expo/vector-icons'
import { Building2 } from 'lucide-react-native'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import {
  useLadderRankings,
  usePlayerLadderPosition,
  useActiveChallenge,
  useCanChallengePosition,
  useCreateChallenge,
} from '@/hooks/useLadder'
import { LadderRankingWithPlayer } from '@/lib/validation/ladder.validation'
import { DEFAULT_LADDER_CONFIG, LadderConfig } from '@/lib/validation/leagues.validation'
import { getPlayerClub } from '@/lib/actions/organizations.actions'
import { supabase } from '@/lib/supabase'

// Helper function to convert MatchData to MatchCard format
function convertToMatchCardData(matches: MatchData[], currentPlayer: any) {
  return matches.map(match => ({
    id: match.id,
    date: match.date,
    currentPlayer: {
      name: `${currentPlayer.first_name} ${currentPlayer.last_name}`,
      countryCode: currentPlayer.country_code || 'US',
      rating: currentPlayer.rating,
    },
    opponent: {
      name: match.opponent.name,
      countryCode: match.opponent.countryCode,
      rating: match.opponent.rating,
    },
    scores: match.scores || [],
    isWin: match.isWin,
    league: match.league,
    gameType: match.gameType,
  }))
}

// Helper function to translate challenge reason
function getChallengeReasonTranslation(reason: string, t: (key: string, options?: any) => string): string {
  // Map server reason strings to translation keys
  if (reason.includes('You already have an active challenge')) {
    return t('league:detail.youHaveActiveChallenge')
  }
  if (reason.includes('This player already has an active challenge')) {
    return t('league:detail.playerHasActiveChallenge')
  }
  if (reason.includes('only challenge players ranked above')) {
    return t('league:detail.canOnlyChallengeAbove')
  }
  if (reason.includes('only challenge up to')) {
    const match = reason.match(/up to (\d+) positions/)
    const positions = match ? match[1] : '3'
    return t('league:detail.maxChallengePositions', { positions })
  }
  if (reason.includes('respond to your pending challenge')) {
    return t('league:detail.mustRespondFirst')
  }
  if (reason.includes('must wait') && reason.includes('days before challenging')) {
    const match = reason.match(/wait (\d+) days/)
    const days = match ? match[1] : '7'
    return t('league:detail.rechallengeCooldownWait', { days })
  }
  if (reason.includes('not in this ladder')) {
    return t('league:detail.notInLadder')
  }
  if (reason.includes('not a ladder competition')) {
    return t('league:detail.notLadderCompetition')
  }
  // Fallback to original reason
  return reason
}

export default function PlayerProfile() {
  const { playerId, leagueId, fromLadder } = useLocalSearchParams<{
    playerId: string
    leagueId?: string
    fromLadder?: string
  }>()
  const isFromLadder = fromLadder === 'true' && !!leagueId
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { showToast } = useAppToast()
  const { confirm } = useConfirmDialog()
  const { t } = useTranslation('profile')
  const { t: tErrors } = useTranslation('errors')
  const [player, setPlayer] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [homecourt, setHomecourt] = useState<any>(null)
  const [clubName, setClubName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [playerStats, setPlayerStats] = useState<PlayerStatsData | null>(null)
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([])

  // Ladder-specific state
  const [showChallengeSheet, setShowChallengeSheet] = useState(false)
  const [ladderConfig, setLadderConfig] = useState<LadderConfig | null>(null)
  const [targetRanking, setTargetRanking] = useState<LadderRankingWithPlayer | null>(null)

  // Ladder hooks - only fetch when coming from ladder
  const { data: rankings = [] } = useLadderRankings(isFromLadder ? leagueId! : '')
  const { data: currentUserPosition } = usePlayerLadderPosition(
    isFromLadder ? leagueId! : '',
    currentUser?.id || null
  )
  const { data: activeChallenge } = useActiveChallenge(
    isFromLadder ? leagueId! : '',
    currentUser?.id || null
  )

  // Get target player's position from rankings
  const targetPlayerPosition = rankings.find(r => r.player_id === playerId)?.position || null

  // Check if current user can challenge this player
  const { data: canChallengeResult } = useCanChallengePosition(
    isFromLadder ? leagueId! : '',
    currentUser?.id || null,
    targetPlayerPosition || 0
  )

  const createChallengeMutation = useCreateChallenge()

  // Determine if challenge button should be shown
  const canChallenge = isFromLadder &&
    currentUser?.id &&
    playerId !== currentUser?.id &&
    targetPlayerPosition !== null &&
    currentUserPosition !== null &&
    currentUserPosition !== undefined &&
    targetPlayerPosition < currentUserPosition &&
    canChallengeResult?.valid === true

  // Determine if submit result button should be shown
  // From community: always allow submit result
  // From ladder: only allow when there's an accepted challenge with this specific player
  const canSubmitResult = !isFromLadder || (
    activeChallenge &&
    activeChallenge.status === 'accepted' &&
    (activeChallenge.challenger_player_id === playerId || activeChallenge.challenged_player_id === playerId)
  )

  useEffect(() => {
    if (playerId) {
      loadPlayerProfile()
      loadCurrentUser()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  // Load ladder config when coming from ladder
  useEffect(() => {
    if (isFromLadder && leagueId) {
      loadLadderConfig()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFromLadder, leagueId])

  // Update target ranking when rankings change
  useEffect(() => {
    if (isFromLadder && rankings.length > 0 && playerId) {
      const ranking = rankings.find(r => r.player_id === playerId)
      if (ranking) {
        setTargetRanking(ranking)
      }
    }
  }, [isFromLadder, rankings, playerId])

  const loadLadderConfig = async () => {
    if (!leagueId) return
    try {
      const { data: league } = await supabase
        .from('leagues')
        .select('ladder_config')
        .eq('id', leagueId)
        .single()

      if (league?.ladder_config) {
        setLadderConfig(league.ladder_config as LadderConfig)
      } else {
        setLadderConfig(DEFAULT_LADDER_CONFIG)
      }
    } catch (error) {
      setLadderConfig(DEFAULT_LADDER_CONFIG)
    }
  }

  // Refresh data when screen comes into focus (e.g., returning from submit result)
  useFocusEffect(
    useCallback(() => {
      if (playerId && !loading) {
        // Only refresh if we already have data loaded (not on initial load)
        loadPlayerProfile()
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId, loading])
  )

  const loadPlayerProfile = async () => {
    if (!playerId) return

    try {
      const { data, error } = await getPlayerById(playerId)
      if (error) {
        // silently handled
      } else {
        setPlayer(data)
        
        // Load homecourt information if player has one
        if (data?.homecourt_id) {
          const { data: courtData } = await getCourtById(data.homecourt_id)
          if (courtData) {
            setHomecourt(courtData)
          }
        }

        // Load club information
        const { data: clubData } = await getPlayerClub(playerId)
        setClubName(clubData?.organization_name || null)

        // Load player stats and recent matches
        const { stats, recentMatches } = await getPlayerStats(playerId)
        setPlayerStats(stats)
        setRecentMatches(recentMatches)
      }
    } catch (error) {
      // silently handled
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const { data } = await getPlayerProfile()
      setCurrentUser(data)
    } catch (error) {
      // silently handled
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadPlayerProfile()
    await loadCurrentUser()
    setRefreshing(false)
  }

  const handleBack = () => {
    router.back()
  }

  const handleSendMessage = async () => {
    if (!player?.phone_number) {
      showToast(t('playerProfile.noPhoneMessage'), { type: 'info' })
      return
    }

    const currentUserName = currentUser
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : 'Someone'

    // Check if we should use WhatsApp based on player's country
    if (shouldUseWhatsApp(player.country_code)) {
      await sendViaWhatsApp(currentUserName)
    } else {
      await sendViaSms(currentUserName)
    }
  }

  const sendViaWhatsApp = async (senderName: string) => {
    const formattedPhone = formatPhoneForWhatsApp(
      player.phone_country_code,
      player.phone_number
    )

    if (!formattedPhone) {
      showToast(t('playerProfile.invalidPhoneNumber'), { type: 'error' })
      return
    }

    const message = t('playerProfile.whatsappMessage', { name: senderName })
    const whatsappUrl = buildWhatsAppUrl(formattedPhone, message)

    try {
      const supported = await Linking.canOpenURL(whatsappUrl)
      if (supported) {
        await Linking.openURL(whatsappUrl)
      } else {
        // WhatsApp not installed - offer SMS fallback
        confirm({
          title: t('playerProfile.whatsappNotInstalled'),
          message: t('playerProfile.whatsappFallbackMessage'),
          cancelText: t('playerProfile.cancel'),
          confirmText: t('playerProfile.useSms'),
          destructive: false,
          onConfirm: () => sendViaSms(senderName),
        })
      }
    } catch (error) {
      showToast(t('playerProfile.whatsappError'), { type: 'error' })
    }
  }

  const sendViaSms = async (senderName: string) => {
    const message = t('playerProfile.smsMessage', { name: senderName })
    const phoneNumber = player.phone_country_code
      ? `${player.phone_country_code}${player.phone_number}`
      : player.phone_number
    const smsUrl = buildSmsUrl(phoneNumber, message)

    try {
      const supported = await Linking.canOpenURL(smsUrl)
      if (supported) {
        await Linking.openURL(smsUrl)
      } else {
        showToast(t('playerProfile.smsNotSupported'), { type: 'error' })
      }
    } catch (error) {
      showToast(t('playerProfile.smsError'), { type: 'error' })
    }
  }

  const handleSubmitResult = () => {
    router.push(`/submit-result?opponentId=${playerId}`)
  }

  const handleChallengePress = () => {
    if (targetRanking) {
      setShowChallengeSheet(true)
    }
  }

  const handleConfirmChallenge = async () => {
    if (!targetPlayerPosition || !leagueId) return

    try {
      await createChallengeMutation.mutateAsync({
        leagueId,
        challengedPosition: targetPlayerPosition,
      })
      setShowChallengeSheet(false)
      showToast(t('playerProfile.challengeSentMessage'), { type: 'success' })
      router.back()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : tErrors('generic.somethingWentWrong')
      showToast(getChallengeReasonTranslation(errorMessage, t), { type: 'error' })
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <ScreenHeader title={t('playerProfile.title')} onBack={handleBack} />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                fontSize: 16,
                marginTop: 16,
                color: colors.foreground,
              }}
            >
              {t('playerProfile.loading')}
            </Text>
          </View>
        </SafeAreaView>
      </>
    )
  }

  if (!player) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <ScreenHeader title={t('playerProfile.title')} onBack={handleBack} />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 40,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                textAlign: 'center',
                color: colors.mutedForeground,
              }}
            >
              {t('playerProfile.notFound')}
            </Text>
          </View>
        </SafeAreaView>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScreenHeader title={t('playerProfile.title')} onBack={handleBack} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }} // Add bottom padding for buttons
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Player Header Card */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 16,
                position: 'relative',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {player.avatar_url ? (
                  <Image
                    source={{ uri: player.avatar_url }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      marginRight: 12,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: colors.primaryForeground,
                      }}
                    >
                      {player.first_name?.charAt(0)?.toUpperCase() || 'P'}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <CountryFlag
                        countryCode={player.country_code}
                        size="md"
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: colors.foreground,
                        }}
                      >
                        {player.first_name} {player.last_name}
                      </Text>
                    </View>
                    
                    {/* Rating Badge - Aligned with name */}
                    {player.rating && (
                      <RatingBadge rating={player.rating} size="md" />
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 2,
                    }}
                  >
                    {clubName ? (
                      <>
                        <Building2 size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '500' }}>
                          {clubName}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name="tennisball-outline"
                          size={12}
                          color={colors.mutedForeground}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                          {homecourt ? homecourt.name : t('playerProfile.noHomecourt')}
                        </Text>
                      </>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={colors.mutedForeground}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.mutedForeground,
                      }}
                    >
                      {t('playerProfile.joined', {
                        date: new Date(player.created_at).toLocaleDateString(undefined, {
                          month: 'long',
                          year: 'numeric'
                        })
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Challenge Status Message - Only show when coming from ladder and can't challenge */}
          {isFromLadder && !canChallengeResult?.valid && canChallengeResult?.reason && currentUser?.id !== playerId && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.mutedForeground,
                    textAlign: 'center',
                  }}
                >
                  {getChallengeReasonTranslation(canChallengeResult.reason, t)}
                </Text>
              </View>
            </View>
          )}

          {/* Stats Section */}
          {playerStats && (
            <PlayerStats stats={playerStats} />
          )}

          {/* Recent Matches Section */}
          {recentMatches.length > 0 && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: colors.foreground,
                  marginBottom: 16,
                }}
              >
                {t('playerProfile.recentMatches')}
              </Text>
              
              {convertToMatchCardData(recentMatches, player).map((match) => (
                <MatchCard 
                  key={match.id} 
                  match={match}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom Buttons - Only show when not viewing own profile */}
        {currentUser && playerId !== currentUser.id && (canChallenge || canSubmitResult) && (
          <BottomButtons
            onCancel={handleSendMessage}
            onSave={canChallenge ? handleChallengePress : handleSubmitResult}
            cancelText={t('playerProfile.sendMessage')}
            saveText={canChallenge ? t('playerProfile.challenge') : t('playerProfile.submitResult')}
          />
        )}
        {/* Single Send Message button when no challenge/submit actions available */}
        {currentUser && playerId !== currentUser.id && !canChallenge && !canSubmitResult && (
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={handleSendMessage}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.secondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
              >
                {t('playerProfile.sendMessage')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Challenge Confirmation Sheet */}
        {isFromLadder && (
          <ChallengeConfirmationSheet
            visible={showChallengeSheet}
            onClose={() => setShowChallengeSheet(false)}
            opponent={targetRanking}
            currentPlayerPosition={currentUserPosition || null}
            ladderConfig={ladderConfig}
            onConfirm={handleConfirmChallenge}
            isLoading={createChallengeMutation.isPending}
            isDoublesLeague={false}
          />
        )}
      </SafeAreaView>
    </>
  )
} 