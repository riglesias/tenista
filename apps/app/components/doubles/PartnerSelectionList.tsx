'use client'

import React, { useState, useMemo } from 'react'
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { useAvailablePartners } from '@/hooks/useDoublesTeam'
import { Search, User, Check } from 'lucide-react-native'

interface AvailablePartner {
  id: string
  first_name: string | null
  last_name: string | null
  rating: number | null
  avatar_url: string | null
}

interface PartnerSelectionListProps {
  leagueId: string
  currentPlayerId: string
  selectedPartnerId: string | null
  onSelectPartner: (partnerId: string | null) => void
}

export default function PartnerSelectionList({
  leagueId,
  currentPlayerId,
  selectedPartnerId,
  onSelectPartner,
}: PartnerSelectionListProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: partners = [], isLoading } = useAvailablePartners(leagueId, currentPlayerId)

  // Filter partners by search query
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners
    const query = searchQuery.toLowerCase()
    return partners.filter((partner) => {
      const fullName = `${partner.first_name || ''} ${partner.last_name || ''}`.toLowerCase()
      return fullName.includes(query)
    })
  }, [partners, searchQuery])

  const renderPartner = ({ item }: { item: AvailablePartner }) => {
    const isSelected = item.id === selectedPartnerId
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Player'

    return (
      <TouchableOpacity
        onPress={() => onSelectPartner(isSelected ? null : item.id)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: isSelected ? colors.accent : 'transparent',
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`Select ${fullName} as partner`}
      >
        {/* Avatar placeholder */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <User size={20} color={colors.mutedForeground} />
        </View>

        {/* Player info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '500',
              color: colors.foreground,
            }}
          >
            {fullName}
          </Text>
          {item.rating && (
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              Rating: {item.rating.toFixed(1)}
            </Text>
          )}
        </View>

        {/* Selection indicator */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSelected && <Check size={14} color={colors.primaryForeground} />}
        </View>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 12,
          }}
        >
          Loading available partners...
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Search input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.muted,
          borderRadius: 10,
          paddingHorizontal: 12,
          marginBottom: 16,
        }}
      >
        <Search size={18} color={colors.mutedForeground} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search players..."
          placeholderTextColor={colors.mutedForeground}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 10,
            fontSize: 15,
            color: colors.foreground,
          }}
        />
      </View>

      {/* Partners list */}
      {filteredPartners.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <User size={40} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: colors.mutedForeground,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            {searchQuery ? 'No players match your search' : 'No available partners'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            {searchQuery
              ? 'Try a different search term'
              : 'All players in this league already have teams'}
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <FlatList
            data={filteredPartners}
            renderItem={renderPartner}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  )
}
