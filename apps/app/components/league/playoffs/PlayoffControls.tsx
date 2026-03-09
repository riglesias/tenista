'use client'

import React from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import {
  Pause,
  Play,
  Trophy,
  RefreshCw
} from 'lucide-react-native'
import { useStartPlayoffTournament } from '@/hooks/usePlayoffs'

interface PlayoffControlsProps {
  tournament: {
    id: string
    status: string
    league_id: string
    current_round?: number
    total_rounds: number
    winner_id?: string | null
    start_date?: string
  }
  leagueId: string
  onRefresh: () => void
}

export default function PlayoffControls({
  tournament,
  leagueId,
  onRefresh
}: PlayoffControlsProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const startMutation = useStartPlayoffTournament()

  const getStatusText = () => {
    switch (tournament.status) {
      case 'not_started':
        return tournament.start_date
          ? `Starts ${new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Not Started'
      case 'in_progress':
        return tournament.current_round
          ? `Round ${tournament.current_round} of ${tournament.total_rounds}`
          : 'In Progress'
      case 'completed':
        return 'Tournament Complete'
      case 'suspended':
        return 'Suspended'
      default:
        return 'Unknown Status'
    }
  }

  const getStatusColor = () => {
    switch (tournament.status) {
      case 'not_started':
        return colors.mutedForeground
      case 'in_progress':
        return colors.warning
      case 'completed':
        return colors.success
      case 'suspended':
        return colors.destructive
      default:
        return colors.mutedForeground
    }
  }

  const handleStartTournament = () => {
    Alert.alert(
      'Start Tournament',
      'Are you sure you want to start the tournament? This will begin the first round of matches.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          style: 'default',
          onPress: () => {
            startMutation.mutate(
              { tournamentId: tournament.id, leagueId },
              {
                onSuccess: () => onRefresh(),
                onError: (error) => {
                  Alert.alert('Error', `Failed to start tournament: ${error.message}`)
                },
              }
            )
          }
        }
      ]
    )
  }

  const handleSuspendTournament = () => {
    Alert.alert(
      'Suspend Tournament',
      'This will pause the tournament temporarily. You can resume it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement suspend tournament mutation
            console.log('Suspending tournament:', tournament.id)
            onRefresh()
          }
        }
      ]
    )
  }

  const handleResumeTournament = () => {
    Alert.alert(
      'Resume Tournament',
      'This will resume the suspended tournament.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          style: 'default',
          onPress: () => {
            // TODO: Implement resume tournament mutation
            console.log('Resuming tournament:', tournament.id)
            onRefresh()
          }
        }
      ]
    )
  }

  const handleAdvanceRound = () => {
    Alert.alert(
      'Advance Round',
      'This will advance to the next round. Make sure all current round matches are completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Advance',
          style: 'default',
          onPress: () => {
            // TODO: Implement advance round mutation
            console.log('Advancing round for tournament:', tournament.id)
            onRefresh()
          }
        }
      ]
    )
  }

  const renderMainControls = () => {
    switch (tournament.status) {
      case 'not_started':
        return (
          <TouchableOpacity
            onPress={handleStartTournament}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1
            }}
          >
            <Play size={20} color={colors.primaryForeground} />
            <Text style={{
              color: colors.primaryForeground,
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8
            }}>
              Start Tournament
            </Text>
          </TouchableOpacity>
        )

      case 'in_progress':
        return (
          <>
            <TouchableOpacity
              onPress={handleAdvanceRound}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                marginRight: 8
              }}
            >
              <Trophy size={20} color={colors.primaryForeground} />
              <Text style={{
                color: colors.primaryForeground,
                fontSize: 14,
                fontWeight: '600',
                marginLeft: 8
              }}>
                Advance Round
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSuspendTournament}
              style={{
                backgroundColor: colors.destructive,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
              }}
            >
              <Pause size={20} color="#fff" />
              <Text style={{
                color: '#fff',
                fontSize: 14,
                fontWeight: '600',
                marginLeft: 8
              }}>
                Suspend
              </Text>
            </TouchableOpacity>
          </>
        )

      case 'suspended':
        return (
          <TouchableOpacity
            onPress={handleResumeTournament}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1
            }}
          >
            <Play size={20} color={colors.primaryForeground} />
            <Text style={{
              color: colors.primaryForeground,
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8
            }}>
              Resume Tournament
            </Text>
          </TouchableOpacity>
        )

      case 'completed':
        return (
          <View style={{
            backgroundColor: colors.success,
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1
          }}>
            <Trophy size={20} color="#fff" />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8
            }}>
              Tournament Complete
            </Text>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
      <View style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
      }}>
        {/* Status Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground
            }}>
              Tournament Controls
            </Text>
            <Text style={{
              fontSize: 14,
              color: getStatusColor(),
              marginTop: 2
            }}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {renderMainControls()}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={onRefresh}
          style={{
            backgroundColor: colors.muted,
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RefreshCw size={16} color={colors.mutedForeground} />
          <Text style={{
            color: colors.mutedForeground,
            fontSize: 14,
            fontWeight: '600',
            marginLeft: 8
          }}>
            Refresh Data
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}