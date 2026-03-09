'use client'

import React from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { DoublesTeamWithPlayers, formatDoublesTeamName } from '@/lib/validation/doubles.validation'
import { Users, Edit2, UserMinus } from 'lucide-react-native'
import CountryFlag from '@/components/ui/CountryFlag'

interface DoublesTeamCardProps {
  team: DoublesTeamWithPlayers
  isCurrentUserTeam?: boolean
  onEdit?: () => void
  onDisband?: () => void
  compact?: boolean
}

export default function DoublesTeamCard({
  team,
  isCurrentUserTeam = false,
  onEdit,
  onDisband,
  compact = false,
}: DoublesTeamCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const teamName = formatDoublesTeamName(team)
  const player1Name = `${team.player1.first_name || ''} ${team.player1.last_name || ''}`.trim() || 'Unknown'
  const player2Name = `${team.player2.first_name || ''} ${team.player2.last_name || ''}`.trim() || 'Unknown'

  if (compact) {
    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Users size={18} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.foreground,
            }}
            numberOfLines={1}
          >
            {teamName}
          </Text>
          {team.combined_rating && (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
              }}
            >
              Rating: {team.combined_rating.toFixed(1)}
            </Text>
          )}
        </View>
      </View>
    )
  }

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: isCurrentUserTeam ? colors.primary : colors.border,
        borderRadius: 12,
        padding: 16,
      }}
    >
      {/* Header with team name and actions */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Users size={22} color={colors.primaryForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              {teamName}
            </Text>
            {team.combined_rating && (
              <View
                style={{
                  backgroundColor: colors.muted,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                  alignSelf: 'flex-start',
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.mutedForeground,
                  }}
                >
                  Combined: {team.combined_rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons for current user's team */}
        {isCurrentUserTeam && (onEdit || onDisband) && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit team"
              >
                <Edit2 size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
            {onDisband && (
              <TouchableOpacity
                onPress={onDisband}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Leave team"
              >
                <UserMinus size={16} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Team members */}
      <View
        style={{
          backgroundColor: colors.muted,
          borderRadius: 10,
          padding: 12,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: colors.mutedForeground,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Team Members
        </Text>

        {/* Player 1 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <CountryFlag
            countryCode={team.player1.nationality_code}
            size="sm"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.foreground,
              flex: 1,
            }}
          >
            {player1Name}
          </Text>
          {team.player1.rating && (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
              }}
            >
              {team.player1.rating.toFixed(1)}
            </Text>
          )}
        </View>

        {/* Player 2 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <CountryFlag
            countryCode={team.player2.nationality_code}
            size="sm"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.foreground,
              flex: 1,
            }}
          >
            {player2Name}
          </Text>
          {team.player2.rating && (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
              }}
            >
              {team.player2.rating.toFixed(1)}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
