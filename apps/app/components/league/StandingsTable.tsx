import React from 'react'
import { FlatList, Text, View, TouchableOpacity, RefreshControl } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { LeagueStanding } from '@/lib/validation/leagues.validation'
import { ChevronRight } from 'lucide-react-native'
import CountryFlag from '@/components/ui/CountryFlag'

const TableHeader = React.memo(function TableHeader() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  
  return (
    <View style={{
      backgroundColor: colors.muted,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 30 }}>#</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, flex: 1 }}>PLAYER</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 30, textAlign: 'center' }}>W</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 30, textAlign: 'center' }}>L</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, width: 40, textAlign: 'center' }}>PTS</Text>
      <View style={{ width: 20 }} />
    </View>
  )
})

const TableRow = React.memo(function TableRow({
  standing,
  isCurrentPlayer,
  onPress,
  isLast = false,
}: {
  standing: LeagueStanding
  isCurrentPlayer: boolean
  onPress?: () => void
  isLast?: boolean
}) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isCurrentPlayer ? colors.accent : 'transparent',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, width: 30 }}>
        {standing.position}
      </Text>
      
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <CountryFlag
          countryCode={standing.nationality_code}
          size="sm"
          style={{ marginRight: 8 }}
        />
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground, flex: 1 }} numberOfLines={1}>
          {standing.player_name}
        </Text>
      </View>
      
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, width: 30, textAlign: 'center' }}>
        {standing.wins}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, width: 30, textAlign: 'center' }}>
        {standing.losses}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, width: 40, textAlign: 'center' }}>
        {standing.points}
      </Text>
      <ChevronRight size={16} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  )
})

interface StandingsTableProps {
  standings: LeagueStanding[]
  currentPlayerId: string | null
  refreshing: boolean
  onRefresh: () => void
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null | undefined
}

const StandingsTable = React.memo(function StandingsTable({
  standings,
  currentPlayerId,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  onPlayerPress,
}: StandingsTableProps & { onPlayerPress?: (playerId: string) => void }) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  
  const renderItem = ({ item, index }: { item: LeagueStanding; index: number }) => {
    const isLast = index === standings.length - 1
    return (
      <TableRow 
        standing={item} 
        isCurrentPlayer={item.player_id === currentPlayerId}
        onPress={() => onPlayerPress?.(item.player_id)}
        isLast={isLast}
      />
    )
  }

  return (
    <>
      {ListHeaderComponent}
      <View style={{
        marginHorizontal: 24,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 120, // Add space for tab navigation
      }}>
        <TableHeader />
        <FlatList
          data={standings}
          renderItem={renderItem}
          keyExtractor={(item) => item.player_id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    </>
  )
})

export default StandingsTable