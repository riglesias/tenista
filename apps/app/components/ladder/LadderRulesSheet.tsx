'use client'

import React from 'react'
import { Text, View, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import BottomSheet from '@/components/ui/BottomSheet'
import { LadderConfig, DEFAULT_LADDER_CONFIG } from '@/lib/validation/leagues.validation'
import { Swords, Clock, TrendingUp, TrendingDown, AlertTriangle, HelpCircle } from 'lucide-react-native'

interface LadderRulesSheetProps {
  visible: boolean
  onClose: () => void
  ladderConfig: LadderConfig | null
}

export default function LadderRulesSheet({
  visible,
  onClose,
  ladderConfig,
}: LadderRulesSheetProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  const config = ladderConfig || DEFAULT_LADDER_CONFIG

  const rules = [
    {
      icon: <Swords size={20} color={colors.primary} />,
      title: t('detail.challengeRange'),
      description: t('detail.challengeRangeDesc', { positions: config.max_challenge_positions }),
    },
    {
      icon: <TrendingUp size={20} color={colors.success} />,
      title: t('detail.winningChallenge'),
      description: t('detail.winningChallengeDesc'),
    },
    {
      icon: <TrendingDown size={20} color={colors.destructive} />,
      title: t('detail.losingChallenge'),
      description: t('detail.losingChallengeDesc'),
    },
    {
      icon: <Clock size={20} color={colors.warning} />,
      title: t('detail.responseDeadline'),
      description: t('detail.responseDeadlineDesc', { days: config.challenge_acceptance_deadline_days }),
    },
    {
      icon: <Clock size={20} color={colors.info} />,
      title: t('detail.matchDeadline'),
      description: t('detail.matchDeadlineDesc', { days: config.match_completion_deadline_days }),
    },
    {
      icon: <AlertTriangle size={20} color={colors.warning} />,
      title: t('detail.rechallengeCooldown'),
      description: config.rechallenge_cooldown_days > 0
        ? t('detail.rechallengeCooldownDesc', { days: config.rechallenge_cooldown_days })
        : t('detail.rechallengeCooldownNone'),
    },
    {
      icon: <AlertTriangle size={20} color={colors.destructive} />,
      title: t('detail.inactivityPenalty'),
      description: t('detail.inactivityPenaltyDesc', { days: config.inactivity_threshold_days, positions: config.inactivity_position_drop }),
    },
  ]

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.75]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <HelpCircle size={28} color={colors.primaryForeground} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.foreground,
            }}
          >
            {t('detail.ladderRules')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {t('detail.ladderRulesSubtitle')}
          </Text>
        </View>

        {/* Rules list */}
        <View style={{ gap: 16, paddingBottom: 20 }}>
          {rules.map((rule, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {rule.icon}
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.foreground,
                    marginLeft: 10,
                  }}
                >
                  {rule.title}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  lineHeight: 20,
                }}
              >
                {rule.description}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </BottomSheet>
  )
}
