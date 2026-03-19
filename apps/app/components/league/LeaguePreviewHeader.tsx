import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import {
  getDivisionInfo,
  LeagueWithStats,
} from '@/lib/validation/leagues.validation'
import { Building2, Calendar, MapPin, Trophy, Users } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import i18n from '@/lib/i18n'

interface LeaguePreviewHeaderProps {
  league: LeagueWithStats
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function LeaguePreviewHeader({ league }: LeaguePreviewHeaderProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  const divisionInfo = league.division
    ? getDivisionInfo(league.division, league.min_rating, league.max_rating)
    : null

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Hero image */}
      <View style={styles.heroContainer}>
        {league.image_url ? (
          <>
            {/* Blurred zoomed background */}
            <Image
              source={{ uri: league.image_url }}
              style={styles.heroBlurredBg}
              resizeMode="cover"
              blurRadius={50}
            />
            {/* Centered square image */}
            <Image
              source={{ uri: league.image_url }}
              style={styles.heroSquareImage}
              resizeMode="cover"
            />
          </>
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted }]}>
            <Trophy size={48} color={colors.mutedForeground} />
          </View>
        )}
        {/* Price badge overlaid on image */}
        <View
          style={[
            styles.priceBadge,
            { backgroundColor: league.is_free ? '#22c55e' : colors.primary },
          ]}
        >
          <Text style={[styles.priceBadgeText, { color: league.is_free ? '#fff' : colors.primaryForeground }]}>
            {league.is_free
              ? t('selection.free')
              : `$${new Intl.NumberFormat(i18n.language).format((league.price_cents || 0) / 100)}`}
          </Text>
        </View>
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <Text style={[styles.leagueName, { color: colors.foreground }]} numberOfLines={2}>
          {league.name}
        </Text>

        <View style={styles.detailRow}>
          <Calendar size={15} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.foreground }]}>
            {t('preview.dateRange', {
              start: formatDate(league.start_date),
              end: formatDate(league.end_date),
            })}
          </Text>
        </View>

        {divisionInfo && (
          <View style={styles.detailRow}>
            <Trophy size={15} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.foreground }]}>
              {t('info.division')}: {divisionInfo.range}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Users size={15} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.foreground }]}>
            {t('preview.players', {
              current: league.player_count,
              max: league.max_players || 50,
            })}
          </Text>
        </View>

        {league.location && (
          <View style={styles.detailRow}>
            <MapPin size={15} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.foreground }]} numberOfLines={1}>
              {league.location}
            </Text>
          </View>
        )}

        {league.organization_id && (
          <View style={styles.detailRow}>
            <Building2 size={15} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.primary, fontWeight: '500' }]} numberOfLines={1}>
              {(league as any).organization_name || 'Club'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  heroContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlurredBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: 2.0 }],
  },
  heroSquareImage: {
    width: 170,
    height: 170,
    borderRadius: 14,
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  leagueName: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
})
