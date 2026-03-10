'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { retireFromLeague } from '@/lib/actions/leagues.actions'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAppToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'

interface LeagueMenuProps {
  visible: boolean
  onClose: () => void
  leagueId: string
  playerId: string | null
  onLeagueLeft: () => void
}

export default function LeagueMenu({
  visible,
  onClose,
  leagueId,
  playerId,
  onLeagueLeft,
}: LeagueMenuProps) {
  const { theme } = useTheme()
  const { t } = useTranslation('league')
  const { showToast } = useAppToast()
  const { confirm } = useConfirmDialog()

  const handleLeaveLeague = async () => {
    if (!playerId) return

    onClose()

    confirm({
      title: t('alerts.retireFromLeague'),
      message: t('alerts.leaveWarning'),
      confirmText: t('list.leaveLeague'),
      cancelText: t('alerts.cancel'),
      destructive: true,
      onConfirm: async () => {
        const { error } = await retireFromLeague(leagueId, playerId)
        if (error) {
          showToast((error as any)?.message || 'Failed to leave league', { type: 'error' })
        } else {
          showToast('You have left the league', { type: 'success' })
          onLeagueLeft()
        }
      },
    })
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleLeaveLeague}
            style={styles.menuItem}
            accessibilityRole="button"
            accessibilityLabel="Leave league"
          >
            <Text style={[styles.menuItemText, { color: theme.destructive }]}>
              Leave League
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 24,
  },
  menuContainer: {
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 150,
  },
  menuItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
}) 