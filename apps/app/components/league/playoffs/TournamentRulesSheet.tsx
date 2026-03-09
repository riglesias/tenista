'use client'

import React from 'react'
import { Text, View, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import BottomSheet from '@/components/ui/BottomSheet'
import { Users, Grid3X3, ArrowRightLeft, Swords, ClipboardList, HelpCircle } from 'lucide-react-native'

interface TournamentRulesSheetProps {
  visible: boolean
  onClose: () => void
}

export default function TournamentRulesSheet({
  visible,
  onClose,
}: TournamentRulesSheetProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('league')

  const rules = [
    {
      icon: <Users size={20} color={colors.primary} />,
      title: t('detail.minimumPlayers'),
      description: t('detail.minimumPlayersDesc'),
    },
    {
      icon: <Grid3X3 size={20} color={colors.info} />,
      title: t('detail.bracketSize'),
      description: t('detail.bracketSizeDesc'),
    },
    {
      icon: <ArrowRightLeft size={20} color={colors.warning} />,
      title: t('detail.byeSystem'),
      description: t('detail.byeSystemDesc'),
    },
    {
      icon: <Swords size={20} color={colors.destructive} />,
      title: t('detail.singleElimination'),
      description: t('detail.singleEliminationDesc'),
    },
    {
      icon: <ClipboardList size={20} color={colors.success} />,
      title: t('detail.matchResults'),
      description: t('detail.matchResultsDesc'),
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
            {t('detail.tournamentRules')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {t('detail.tournamentRulesSubtitle')}
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
