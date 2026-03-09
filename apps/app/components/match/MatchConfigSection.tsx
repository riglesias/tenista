import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { GameType, MatchType, NumberOfSets } from '@/hooks/useMatchForm'
import DateTimePicker from '@react-native-community/datetimepicker'

interface MatchConfigSectionProps {
  matchDate: Date
  onDateChange: (event: any, selectedDate?: Date) => void
  showDatePicker: boolean
  setShowDatePicker: (show: boolean) => void
  numberOfSets: NumberOfSets
  setNumberOfSets: (sets: NumberOfSets) => void
  gameType: GameType
  setGameType: (type: GameType) => void
  matchType: MatchType
  setMatchType: (type: MatchType) => void
}

export default function MatchConfigSection({
  matchDate,
  onDateChange,
  showDatePicker,
  setShowDatePicker,
  numberOfSets,
  setNumberOfSets,
  gameType,
  setGameType,
  matchType,
  setMatchType,
}: MatchConfigSectionProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 12,
      marginTop: 20,
    }}>
      {title}
    </Text>
  )

  const OptionButton = ({ 
    label, 
    selected, 
    onPress 
  }: { 
    label: string
    selected: boolean
    onPress: () => void 
  }) => (
    <TouchableOpacity
      style={{
        backgroundColor: selected ? colors.primary : colors.card,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
      }}
      onPress={onPress}
    >
      <Text style={{
        color: selected ? colors.primaryForeground : colors.foreground,
        fontWeight: selected ? '600' : '400',
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View>
      <SectionHeader title="Match Date" />
      <TouchableOpacity
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: colors.foreground, fontSize: 16 }}>
          {matchDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={matchDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <SectionHeader title="Number of Sets" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {([1, 3, 5] as NumberOfSets[]).map((sets) => (
          <OptionButton
            key={sets}
            label={`${sets} Set${sets > 1 ? 's' : ''}`}
            selected={numberOfSets === sets}
            onPress={() => setNumberOfSets(sets)}
          />
        ))}
      </View>

      <SectionHeader title="Game Type" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <OptionButton
          label="Competitive"
          selected={gameType === 'competitive'}
          onPress={() => setGameType('competitive')}
        />
        <OptionButton
          label="Practice"
          selected={gameType === 'practice'}
          onPress={() => setGameType('practice')}
        />
      </View>

      <SectionHeader title="Match Type" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <OptionButton
          label="Singles"
          selected={matchType === 'singles'}
          onPress={() => setMatchType('singles')}
        />
        <OptionButton
          label="Doubles"
          selected={matchType === 'doubles'}
          onPress={() => setMatchType('doubles')}
        />
      </View>
    </View>
  )
}