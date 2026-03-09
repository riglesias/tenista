'use client'

import React, { useState } from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import DoublesTeamFormSheet from './DoublesTeamFormSheet'
import { Users, UserPlus } from 'lucide-react-native'

interface DoublesTeamPromptProps {
  leagueId: string
  currentPlayerId: string
  onTeamCreated?: () => void
}

export default function DoublesTeamPrompt({
  leagueId,
  currentPlayerId,
  onTeamCreated,
}: DoublesTeamPromptProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [showFormSheet, setShowFormSheet] = useState(false)

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Users size={36} color={colors.primary} />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Doubles League
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 15,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          This is a doubles competition. You need to form a team with another player to participate in the ladder.
        </Text>

        {/* Benefits list */}
        <View
          style={{
            backgroundColor: colors.muted,
            borderRadius: 12,
            padding: 16,
            width: '100%',
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            When you form a team:
          </Text>
          <View style={{ gap: 8 }}>
            {[
              'Your combined rating is calculated',
              'You can challenge other teams',
              'Both players share the ladder position',
              'Either player can accept challenges',
            ].map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 14, color: colors.primary, marginRight: 8 }}>•</Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    flex: 1,
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={() => setShowFormSheet(true)}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
          accessibilityRole="button"
          accessibilityLabel="Form a team"
        >
          <UserPlus size={20} color={colors.primaryForeground} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.primaryForeground,
              marginLeft: 10,
            }}
          >
            Form a Team
          </Text>
        </TouchableOpacity>
      </View>

      {/* Team form sheet */}
      <DoublesTeamFormSheet
        visible={showFormSheet}
        onClose={() => setShowFormSheet(false)}
        leagueId={leagueId}
        currentPlayerId={currentPlayerId}
        onTeamCreated={onTeamCreated}
      />
    </View>
  )
}
