'use client'

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Play, Settings, Calendar } from 'lucide-react-native'
import { useCreatePlayoffTournament } from '@/hooks/usePlayoffs'
import { StandaloneQualifiedPlayer } from '@/lib/validation/playoffs.validation'
import CountryFlag from '@/components/ui/CountryFlag'
import DateTimePicker from '@react-native-community/datetimepicker'

// Table header component matching LadderRankingsTable style
const TableHeader = React.memo(function TableHeader({ colors, mode }: { colors: any; mode: 'league' | 'standalone' }) {
  const headerTextStyle = {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: colors.mutedForeground,
  }

  return (
    <View
      style={{
        backgroundColor: colors.muted,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ ...headerTextStyle, width: 32 }}>#</Text>
      <Text style={{ ...headerTextStyle, flex: 1 }}>PLAYER</Text>
      {mode === 'standalone' ? (
        <>
          <Text style={{ ...headerTextStyle, width: 36, textAlign: 'center' }}>W</Text>
          <Text style={{ ...headerTextStyle, width: 36, textAlign: 'center' }}>L</Text>
        </>
      ) : (
        <Text style={{ ...headerTextStyle, width: 60, textAlign: 'right' }}>PTS</Text>
      )}
    </View>
  )
})

// League mode player type
interface LeagueQualifiedPlayer {
  id: string
  firstName: string | null
  lastName: string | null
  seedPosition: number
  leaguePosition: number
  leaguePoints: number
  rating: number | null
  nationality_code?: string | null
}

// League mode data type
interface LeagueQualifyingData {
  qualifiedPlayers: LeagueQualifiedPlayer[]
  standings: any[]
  tieBreakersApplied: string[]
  eliminatedPlayers: any[]
}

// Standalone mode data type
interface StandaloneQualifyingData {
  qualifiedPlayers: StandaloneQualifiedPlayer[]
  seedingCriteriaApplied: string[]
}

// Props for league mode
interface LeagueModeProps {
  mode: 'league'
  qualifyingData: LeagueQualifyingData
  standaloneData?: never
}

// Props for standalone mode
interface StandaloneModeProps {
  mode: 'standalone'
  standaloneData: StandaloneQualifyingData
  qualifyingData?: never
}

// Base props shared by both modes
interface BaseProps {
  qualifyingCount: number
  onQualifyingCountChange: (count: number) => void
  canManage: boolean
  leagueId: string
  leagueEndDate: string
  onTournamentCreated: () => void
}

type QualifyingPlayersCardProps = BaseProps & (LeagueModeProps | StandaloneModeProps)

export default function QualifyingPlayersCard(props: QualifyingPlayersCardProps) {
  const {
    mode,
    qualifyingCount,
    onQualifyingCountChange,
    canManage,
    leagueId,
    leagueEndDate,
    onTournamentCreated
  } = props

  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [showSettings, setShowSettings] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const createTournamentMutation = useCreatePlayoffTournament()

  // Get the qualified players based on mode
  const qualifiedPlayers = mode === 'league'
    ? props.qualifyingData.qualifiedPlayers
    : props.standaloneData.qualifiedPlayers

  // Get criteria/tie-breakers based on mode
  const criteriaApplied = mode === 'league'
    ? props.qualifyingData.tieBreakersApplied
    : props.standaloneData.seedingCriteriaApplied

  const handleCreateTournament = () => {
    Alert.alert(
      'Create Playoff Tournament',
      `Are you sure you want to create a playoff tournament with ${qualifyingCount} players? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Create',
          style: 'destructive',
          onPress: () => {
            createTournamentMutation.mutate(
              {
                league_id: leagueId,
                qualifying_players_count: qualifyingCount,
                start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
              },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Playoff tournament created successfully!')
                  onTournamentCreated()
                },
                onError: (error) => {
                  Alert.alert('Error', `Failed to create tournament: ${error.message}`)
                },
              }
            )
          },
        },
      ]
    )
  }

  const qualifyingCountOptions = [4, 8, 16, 32]

  return (
    <View style={{ paddingBottom: 16 }}>
      {/* Title section - matching BracketTab pattern */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.foreground
        }}>
          Registered Players ({qualifiedPlayers.length})
        </Text>

        {canManage && (
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            style={{ padding: 4 }}
          >
            <Settings size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Settings Panel */}
      {showSettings && canManage && (
        <View style={{
          marginHorizontal: 24,
          backgroundColor: colors.muted,
          borderRadius: 8,
          padding: 12,
          marginBottom: 12
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 8
          }}>
            Tournament Size
          </Text>
          <View style={{
            flexDirection: 'row',
            gap: 8,
            flexWrap: 'wrap'
          }}>
            {qualifyingCountOptions.map((count) => (
              <TouchableOpacity
                key={count}
                onPress={() => onQualifyingCountChange(count)}
                style={{
                  backgroundColor: count === qualifyingCount ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: count === qualifyingCount ? colors.primary : colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  minWidth: 40,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: count === qualifyingCount ? colors.primaryForeground : colors.foreground,
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Date Picker */}
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginTop: 16,
            marginBottom: 8
          }}>
            Start Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Calendar size={16} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 8 }}>
              {(startDate || new Date(leagueEndDate)).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDate || new Date(leagueEndDate)}
              mode="date"
              display="default"
              onChange={(event: any, selectedDate?: Date) => {
                setShowDatePicker(Platform.OS === 'ios')
                if (selectedDate) {
                  setStartDate(selectedDate)
                }
              }}
            />
          )}
        </View>
      )}

      {/* Card with players list - matching LadderRankingsTable style */}
      <View style={{
        marginHorizontal: 24,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <TableHeader colors={colors} mode={mode} />

        {/* Qualified Players List */}
        <View>
          {qualifiedPlayers.map((player, index) => (
            <PlayerRow
              key={player.id}
              player={player}
              index={index}
              colors={colors}
              mode={mode}
              isLast={index === qualifiedPlayers.length - 1}
            />
          ))}
        </View>

        {/* Seeding Criteria Applied - only show for standalone mode */}
        {mode === 'standalone' && criteriaApplied.length > 0 && (
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.mutedForeground,
              marginBottom: 4
            }}>
              SEEDING CRITERIA
            </Text>
            {criteriaApplied.map((criterion, index) => (
              <Text
                key={index}
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  lineHeight: 16
                }}
              >
                • {criterion}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Create Tournament Button - outside card */}
      {canManage && (
        <TouchableOpacity
          onPress={handleCreateTournament}
          disabled={createTournamentMutation.isPending}
          style={{
            marginHorizontal: 24,
            marginTop: 16,
            backgroundColor: createTournamentMutation.isPending ? colors.muted : colors.primary,
            borderRadius: 8,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play size={20} color={colors.primaryForeground} />
          <Text style={{
            color: colors.primaryForeground,
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8
          }}>
            {createTournamentMutation.isPending ? 'Creating...' : 'Start Playoffs'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// Union type for player props
type PlayerRowPlayer = LeagueQualifiedPlayer | StandaloneQualifiedPlayer

interface PlayerRowProps {
  player: PlayerRowPlayer
  index: number
  colors: any
  mode: 'league' | 'standalone'
  isLast?: boolean
}

function PlayerRow({ player, index, colors, mode, isLast = false }: PlayerRowProps) {
  // Type guards to determine player type
  const isLeaguePlayer = (p: PlayerRowPlayer): p is LeagueQualifiedPlayer => {
    return 'leaguePosition' in p
  }

  const isStandalonePlayer = (p: PlayerRowPlayer): p is StandaloneQualifiedPlayer => {
    return 'wins' in p && 'losses' in p
  }

  // Get nationality code
  const nationalityCode = player.nationality_code

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.border,
    }}>
      {/* Seed Position */}
      <Text style={{
        width: 32,
        fontSize: 14,
        fontWeight: '600',
        color: colors.mutedForeground,
      }}>
        {player.seedPosition}
      </Text>

      {/* Player Info */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <CountryFlag
          countryCode={nationalityCode}
          size="sm"
          style={{ marginRight: 8 }}
        />
        <Text style={{
          fontSize: 15,
          fontWeight: '500',
          color: colors.foreground
        }}>
          {player.firstName && player.lastName
            ? `${player.firstName} ${player.lastName.charAt(0)}.`
            : `${player.firstName || ''} ${player.lastName || ''}`.trim()}
        </Text>
      </View>

      {/* Stats on the right - matching header column widths */}
      {mode === 'standalone' && isStandalonePlayer(player) && (
        <>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            width: 36,
            textAlign: 'center',
          }}>
            {player.wins}
          </Text>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            width: 36,
            textAlign: 'center',
          }}>
            {player.losses}
          </Text>
        </>
      )}

      {mode === 'league' && isLeaguePlayer(player) && (
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.foreground,
          width: 60,
          textAlign: 'right',
        }}>
          {player.leaguePoints}
        </Text>
      )}
    </View>
  )
}
