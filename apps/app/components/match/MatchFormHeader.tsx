import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { PlayerData } from '@/hooks/useMatchData'
import CountryFlag from '@/components/ui/CountryFlag'

interface MatchFormHeaderProps {
  currentPlayer: PlayerData
  opponent: PlayerData
}

const MatchFormHeader = React.memo(function MatchFormHeader({ currentPlayer, opponent }: MatchFormHeaderProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const PlayerCard = ({ player, label }: { player: PlayerData; label: string }) => (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 4 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CountryFlag
          countryCode={player.nationality_code}
          size="md"
          style={{ marginRight: 6 }}
        />
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          {player.first_name} {player.last_name}
        </Text>
      </View>
      {player.rating && (
        <View style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          marginTop: 4,
        }}>
          <Text style={{
            color: colors.primaryForeground,
            fontSize: 12,
            fontWeight: '600',
          }}>
            {player.rating.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  )

  return (
    <View style={{
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: 16,
      }}>
        Match Details
      </Text>
      
      <View style={{ flexDirection: 'row' }}>
        <PlayerCard player={currentPlayer} label="You" />
        
        <View style={{ 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <Text style={{ fontSize: 16, color: colors.mutedForeground }}>vs</Text>
        </View>
        
        <PlayerCard player={opponent} label="Opponent" />
      </View>
    </View>
  )
})

export default MatchFormHeader