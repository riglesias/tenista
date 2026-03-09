import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { useJoinLeagueMutation, useLeaveLeagueMutation } from '@/hooks/useLeagueMutations'
import { useAuth } from '@/contexts/AuthContext'

interface LeagueActionButtonProps {
  leagueId: string
  isUserMember: boolean
  disabled?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export default function LeagueActionButton({
  leagueId,
  isUserMember,
  disabled = false,
  onSuccess,
  onError,
}: LeagueActionButtonProps) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  
  const joinMutation = useJoinLeagueMutation()
  const leaveMutation = useLeaveLeagueMutation()

  const isLoading = joinMutation.isPending || leaveMutation.isPending

  const handlePress = async () => {
    if (!user || disabled || isLoading) return

    try {
      if (isUserMember) {
        await leaveMutation.mutateAsync({
          leagueId,
          playerId: user.id,
        })
      } else {
        await joinMutation.mutateAsync({
          leagueId,
          playerId: user.id,
        })
      }
      onSuccess?.()
    } catch (error) {
      onError?.(error as Error)
    }
  }

  const buttonStyle = {
    backgroundColor: isUserMember ? colors.destructive : colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: disabled || isLoading ? 0.6 : 1,
  }

  const textStyle = {
    color: isUserMember ? colors.destructiveForeground : colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600' as const,
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={isUserMember ? colors.destructiveForeground : colors.primaryForeground} 
        />
      ) : (
        <Text style={textStyle}>
          {isUserMember ? 'Leave League' : 'Join League'}
        </Text>
      )}
    </TouchableOpacity>
  )
}