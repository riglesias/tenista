'use client'

import React, { useState, useCallback } from 'react'
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import BottomSheet from '@/components/ui/BottomSheet'
import PartnerSelectionList from './PartnerSelectionList'
import { useCreateDoublesTeam } from '@/hooks/useDoublesTeam'
import { Users } from 'lucide-react-native'

interface DoublesTeamFormSheetProps {
  visible: boolean
  onClose: () => void
  leagueId: string
  currentPlayerId: string
  onTeamCreated?: () => void
}

export default function DoublesTeamFormSheet({
  visible,
  onClose,
  leagueId,
  currentPlayerId,
  onTeamCreated,
}: DoublesTeamFormSheetProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')

  const createTeamMutation = useCreateDoublesTeam()

  const handleCreateTeam = useCallback(async () => {
    if (!selectedPartnerId) {
      Alert.alert('Select Partner', 'Please select a partner to form a team.')
      return
    }

    try {
      await createTeamMutation.mutateAsync({
        leagueId,
        partnerId: selectedPartnerId,
        teamName: teamName.trim() || undefined,
        currentPlayerId,
      })

      // Reset form
      setSelectedPartnerId(null)
      setTeamName('')
      onClose()
      onTeamCreated?.()

      Alert.alert('Team Created', 'Your doubles team has been created successfully!')
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create team')
    }
  }, [selectedPartnerId, teamName, leagueId, currentPlayerId, createTeamMutation, onClose, onTeamCreated])

  const handleClose = useCallback(() => {
    setSelectedPartnerId(null)
    setTeamName('')
    onClose()
  }, [onClose])

  return (
    <BottomSheet visible={visible} onClose={handleClose} snapPoints={[0.85]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Users size={28} color={colors.primaryForeground} />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.foreground,
              }}
            >
              Form a Doubles Team
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Select a partner to compete together
            </Text>
          </View>

          {/* Team name input (optional) */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.mutedForeground,
                marginBottom: 8,
              }}
            >
              Team Name (Optional)
            </Text>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g., Dynamic Duo"
              placeholderTextColor={colors.mutedForeground}
              maxLength={50}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: colors.foreground,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: colors.mutedForeground,
                marginTop: 4,
              }}
            >
              Leave empty to use player names
            </Text>
          </View>

          {/* Partner selection */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.mutedForeground,
                marginBottom: 12,
              }}
            >
              Select Partner
            </Text>
            <PartnerSelectionList
              leagueId={leagueId}
              currentPlayerId={currentPlayerId}
              selectedPartnerId={selectedPartnerId}
              onSelectPartner={setSelectedPartnerId}
            />
          </View>
        </ScrollView>

        {/* Action buttons - Fixed at bottom */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleClose}
            disabled={createTeamMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateTeam}
            disabled={!selectedPartnerId || createTeamMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: selectedPartnerId ? colors.primary : colors.muted,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Create team"
          >
            {createTeamMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Users size={18} color={selectedPartnerId ? colors.primaryForeground : colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: selectedPartnerId ? colors.primaryForeground : colors.mutedForeground,
                    marginLeft: 8,
                  }}
                >
                  Create Team
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
