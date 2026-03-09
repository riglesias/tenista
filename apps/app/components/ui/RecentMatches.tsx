'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, View } from 'react-native'
import CountryFlag from './CountryFlag'

// Helper function to format opponent name with last name initial
function formatOpponentName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) {
    return parts[0] // If only one name, return as is
  }
  const firstName = parts[0]
  const lastNameInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastNameInitial}.`
}

// Helper function to extract division badge from division string
function getDivisionBadge(division: string): string | null {
  const match = division.match(/division_(\d+)/)
  return match ? `D${match[1]}` : null
}

// Separate interface for RecentMatches component (different from MatchCard)
interface RecentMatchData {
  id: string
  date: string
  opponent: {
    name: string
    countryCode: string
  }
  score: string
  isWin: boolean
  league?: {
    id: string
    name: string
    division: string
  }
  gameType: string
}

interface RecentMatchesProps {
  matches: RecentMatchData[]
}

export default function RecentMatches({ matches }: RecentMatchesProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    })
  }

  const MatchRow = ({ match }: { match: RecentMatchData }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Date Column */}
      <View style={{ flex: 0.8 }}>
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
          }}
        >
          {formatDate(match.date)}
        </Text>
      </View>

      {/* Opponent Column */}
      <View style={{ flex: 1.8, flexDirection: 'row', alignItems: 'center' }}>
        <CountryFlag
          countryCode={match.opponent.countryCode}
          size="sm"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            fontSize: 14,
            color: colors.foreground,
            fontWeight: '500',
          }}
        >
          {formatOpponentName(match.opponent.name)}
        </Text>
      </View>

      {/* Score Column */}
      <View style={{ flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Division Badge for competitive league matches */}
        {match.gameType === 'competitive' && match.league && (
          <View
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 4,
              marginRight: 6,
            }}
          >
            <Text
              style={{
                color: colors.primaryForeground,
                fontSize: 10,
                fontWeight: '600',
              }}
            >
              {getDivisionBadge(match.league.division)}
            </Text>
          </View>
        )}
        
        {/* Trophy for wins */}
        {match.isWin && (
          <Ionicons
            name="trophy"
            size={16}
            color="#FFD700"
            style={{ marginRight: 8 }}
          />
        )}
        
        <Text
          style={{
            fontSize: 14,
            color: colors.foreground,
            fontWeight: '600',
          }}
        >
          {match.score}
        </Text>
      </View>
    </View>
  )

  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.foreground,
          marginBottom: 16,
        }}
      >
        Recent Matches
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.muted,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 0.8 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Date
            </Text>
          </View>
          <View style={{ flex: 1.8 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Opponent
            </Text>
          </View>
          <View style={{ flex: 1.4, alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Score
            </Text>
          </View>
        </View>

        {/* Match Rows */}
        <View style={{ paddingHorizontal: 16 }}>
          {matches.length > 0 ? (
            matches.map((match, index) => (
              <MatchRow 
                key={match.id} 
                match={match}
              />
            ))
          ) : (
            <View
              style={{
                paddingVertical: 32,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                }}
              >
                No recent matches found
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

// Export the interface for use in other files
export type { RecentMatchData }
