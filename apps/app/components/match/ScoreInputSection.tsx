import React from 'react'
import { Text, TextInput, View } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { SetScore, NumberOfSets } from '@/hooks/useMatchForm'
import { PlayerData } from '@/hooks/useMatchData'

interface ScoreInputSectionProps {
  scores: SetScore[]
  numberOfSets: NumberOfSets
  currentPlayer: PlayerData
  opponent: PlayerData
  updateScore: (setIndex: number, player: 'player1' | 'player2', value: number) => void
  isSetDisabled: (setIndex: number) => boolean
  winner: 'player1' | 'player2' | null
}

export default function ScoreInputSection({
  scores,
  numberOfSets,
  currentPlayer,
  opponent,
  updateScore,
  isSetDisabled,
  winner,
}: ScoreInputSectionProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const ScoreInput = ({
    value,
    onChangeText,
    disabled,
    isWinner,
  }: {
    value: number
    onChangeText: (text: string) => void
    disabled: boolean
    isWinner?: boolean
  }) => (
    <TextInput
      style={{
        backgroundColor: disabled ? colors.muted : colors.card,
        borderWidth: 1,
        borderColor: isWinner ? colors.primary : colors.border,
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: isWinner ? '600' : '400',
        color: disabled ? colors.mutedForeground : colors.foreground,
        width: 60,
      }}
      value={value.toString()}
      onChangeText={onChangeText}
      keyboardType="numeric"
      editable={!disabled}
      selectTextOnFocus
      maxLength={2}
    />
  )

  return (
    <View>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 16,
        marginTop: 20,
      }}>
        Scores
      </Text>

      {/* Header row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 16,
      }}>
        <Text style={{
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: colors.foreground,
        }}>
          Player
        </Text>
        {Array.from({ length: numberOfSets }, (_, index) => (
          <View key={index} style={{ width: 70, alignItems: 'center' }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.mutedForeground,
            }}>
              Set {index + 1}
            </Text>
          </View>
        ))}
      </View>

      {/* Current player row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.foreground,
          }}>
            {currentPlayer.first_name} {currentPlayer.last_name} (You)
          </Text>
          {winner === 'player1' && (
            <Text style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: '600',
            }}>
              Winner
            </Text>
          )}
        </View>
        {scores.slice(0, numberOfSets).map((score, index) => (
          <View key={index} style={{ width: 70, alignItems: 'center' }}>
            <ScoreInput
              value={score.player1}
              onChangeText={(text) => {
                const value = parseInt(text) || 0
                updateScore(index, 'player1', value)
              }}
              disabled={isSetDisabled(index)}
              isWinner={winner === 'player1' && score.player1 > score.player2}
            />
          </View>
        ))}
      </View>

      {/* Opponent row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.foreground,
          }}>
            {opponent.first_name} {opponent.last_name}
          </Text>
          {winner === 'player2' && (
            <Text style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: '600',
            }}>
              Winner
            </Text>
          )}
        </View>
        {scores.slice(0, numberOfSets).map((score, index) => (
          <View key={index} style={{ width: 70, alignItems: 'center' }}>
            <ScoreInput
              value={score.player2}
              onChangeText={(text) => {
                const value = parseInt(text) || 0
                updateScore(index, 'player2', value)
              }}
              disabled={isSetDisabled(index)}
              isWinner={winner === 'player2' && score.player2 > score.player1}
            />
          </View>
        ))}
      </View>

      {/* Match summary */}
      {winner && (
        <View style={{
          backgroundColor: colors.muted,
          borderRadius: 8,
          padding: 12,
          marginTop: 8,
        }}>
          <Text style={{
            fontSize: 14,
            color: colors.foreground,
            textAlign: 'center',
          }}>
            {winner === 'player1' 
              ? `You win this match!`
              : `${opponent.first_name} ${opponent.last_name} wins this match!`
            }
          </Text>
        </View>
      )}
    </View>
  )
}