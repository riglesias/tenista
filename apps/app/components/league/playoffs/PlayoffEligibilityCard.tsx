'use client'

import React from 'react'
import { View, Text } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react-native'

interface PlayoffEligibilityCardProps {
  eligibility: {
    eligible: boolean
    reason?: string
    playerCount: number
    minRequired: number
  } | undefined
  playerCount: number
  canStart: boolean
  reason: string
}

export default function PlayoffEligibilityCard({
  eligibility,
  playerCount,
  canStart,
  reason
}: PlayoffEligibilityCardProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  if (!eligibility) {
    return null
  }

  const getStatusIcon = () => {
    if (canStart) {
      return <CheckCircle size={24} color={colors.success} />
    } else if (eligibility.eligible) {
      return <Clock size={24} color={colors.warning} />
    } else {
      return <XCircle size={24} color={colors.destructive} />
    }
  }

  const getStatusColor = () => {
    if (canStart) return colors.success
    if (eligibility.eligible) return colors.warning
    return colors.destructive
  }

  const getStatusText = () => {
    if (canStart) return 'Ready for Playoffs'
    if (eligibility.eligible) return 'Pending'
    return 'Not Eligible'
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
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          {getStatusIcon()}
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: getStatusColor(),
            marginLeft: 12
          }}>
            {getStatusText()}
          </Text>
        </View>

        {/* Player Count */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: 12
        }}>
          <Users size={20} color={colors.mutedForeground} />
          <Text style={{ 
            fontSize: 14, 
            color: colors.foreground,
            marginLeft: 8
          }}>
            {eligibility.playerCount} players enrolled
          </Text>
          {eligibility.playerCount >= eligibility.minRequired && (
            <View style={{
              backgroundColor: colors.success,
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
              marginLeft: 8
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: '#fff',
                fontWeight: '600'
              }}>
                ✓
              </Text>
            </View>
          )}
        </View>

        {/* Reason/Description */}
        {reason && (
          <Text style={{ 
            fontSize: 14, 
            color: colors.mutedForeground,
            lineHeight: 20
          }}>
            {reason}
          </Text>
        )}

        {/* Requirements */}
        <View style={{ 
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border
        }}>
          <Text style={{ 
            fontSize: 12, 
            color: colors.mutedForeground,
            fontWeight: '600',
            marginBottom: 8
          }}>
            PLAYOFF REQUIREMENTS
          </Text>
          
          <View style={{ gap: 4 }}>
            <RequirementItem
              met={eligibility.playerCount >= eligibility.minRequired}
              text={`At least ${eligibility.minRequired} players`}
              colors={colors}
            />
            
            <RequirementItem
              met={canStart}
              text="League has ended"
              colors={colors}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

interface RequirementItemProps {
  met: boolean
  text: string
  colors: any
}

function RequirementItem({ met, text, colors }: RequirementItemProps) {
  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center',
      gap: 8
    }}>
      <View style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: met ? colors.success : colors.muted,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {met && (
          <Text style={{ 
            fontSize: 10, 
            color: '#fff',
            fontWeight: 'bold'
          }}>
            ✓
          </Text>
        )}
      </View>
      <Text style={{ 
        fontSize: 14, 
        color: met ? colors.foreground : colors.mutedForeground
      }}>
        {text}
      </Text>
    </View>
  )
}