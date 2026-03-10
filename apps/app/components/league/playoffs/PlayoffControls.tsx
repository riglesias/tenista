'use client'

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useAppToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import {
  Pause,
  Play,
  Trophy,
  RefreshCw
} from 'lucide-react-native'
import {
  useStartPlayoffTournament,
  useSuspendPlayoffTournament,
  useResumePlayoffTournament,
  useAdvancePlayoffRound
} from '@/hooks/usePlayoffs'

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
  const suspendMutation = useSuspendPlayoffTournament()
  const resumeMutation = useResumePlayoffTournament()
  const advanceMutation = useAdvancePlayoffRound()
  const { showToast } = useAppToast()
  const { confirm } = useConfirmDialog()

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
    confirm({
      title: 'Start Tournament',
      message: 'Are you sure you want to start the tournament? This will begin the first round of matches.',
      confirmText: 'Start',
      cancelText: 'Cancel',
      destructive: false,
      onConfirm: () => {
        startMutation.mutate(
          { tournamentId: tournament.id, leagueId },
          {
            onSuccess: () => onRefresh(),
            onError: (error) => {
              showToast(`Failed to start tournament: ${error.message}`, { type: 'error' })
            },
          }
        )
      },
    })
  }

  const handleSuspendTournament = () => {
    confirm({
      title: 'Suspend Tournament',
      message: 'This will pause the tournament temporarily. You can resume it later.',
      confirmText: 'Suspend',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: () => {
        suspendMutation.mutate(
          { tournamentId: tournament.id, leagueId },
          {
            onSuccess: () => {
              showToast('Tournament suspended', { type: 'success' })
              onRefresh()
            },
            onError: (error) => {
              showToast(`Failed to suspend tournament: ${error.message}`, { type: 'error' })
            },
          }
        )
      },
    })
  }

  const handleResumeTournament = () => {
    confirm({
      title: 'Resume Tournament',
      message: 'This will resume the suspended tournament.',
      confirmText: 'Resume',
      cancelText: 'Cancel',
      destructive: false,
      onConfirm: () => {
        resumeMutation.mutate(
          { tournamentId: tournament.id, leagueId },
          {
            onSuccess: () => {
              showToast('Tournament resumed', { type: 'success' })
              onRefresh()
            },
            onError: (error) => {
              showToast(`Failed to resume tournament: ${error.message}`, { type: 'error' })
            },
          }
        )
      },
    })
  }

  const handleAdvanceRound = () => {
    confirm({
      title: 'Advance Round',
      message: 'This will advance to the next round. Make sure all current round matches are completed.',
      confirmText: 'Advance',
      cancelText: 'Cancel',
      destructive: false,
      onConfirm: () => {
        advanceMutation.mutate(
          { tournamentId: tournament.id, leagueId },
          {
            onSuccess: () => {
              showToast('Advanced to next round', { type: 'success' })
              onRefresh()
            },
            onError: (error) => {
              showToast(`Failed to advance round: ${error.message}`, { type: 'error' })
            },
          }
        )
      },
    })
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