import { useTheme } from '@/contexts/ThemeContext'
import { getDivisionInfo, UserLeague } from '@/lib/validation/leagues.validation'
import React from 'react'
import { Text, View } from 'react-native'

interface LeagueInfoCardProps {
  selectedLeague: UserLeague
}

const LeagueInfoCard = React.memo(function LeagueInfoCard({ selectedLeague }: LeagueInfoCardProps) {
  const { theme } = useTheme()
  const divisionInfo = getDivisionInfo(selectedLeague.league.division || 'A')

  return (
    <View style={{
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 24,
      marginBottom: 16,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.foreground,
          flex: 1,
        }}>
          {selectedLeague.league.name}
        </Text>
        <View style={{
          backgroundColor: divisionInfo.color,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
          }}>
            Division {selectedLeague.league.division}
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.foreground,
          }}>
            {selectedLeague.membership.points || 0}
          </Text>
          <Text style={{
            fontSize: 12,
            color: theme.mutedForeground,
          }}>
            Points
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.foreground,
          }}>
            {selectedLeague.user_position || '-'}
          </Text>
          <Text style={{
            fontSize: 12,
            color: theme.mutedForeground,
          }}>
            Rank
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.foreground,
          }}>
            {selectedLeague.total_players}
          </Text>
          <Text style={{
            fontSize: 12,
            color: theme.mutedForeground,
          }}>
            Players
          </Text>
        </View>
      </View>
    </View>
  )
})

export default LeagueInfoCard