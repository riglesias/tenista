'use client'

import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage, languages, Language } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LanguageSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSelectionSheet({ visible, onClose }: LanguageSelectionSheetProps) {
  const { language, setLanguage, isLoading } = useLanguage();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation('settings');

  const handleSelectLanguage = async (langCode: Language) => {
    if (langCode !== language) {
      await setLanguage(langCode);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 34
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View style={{
              width: 36,
              height: 4,
              backgroundColor: colors.muted,
              borderRadius: 2
            }} />
          </View>

          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.foreground
            }}>
              {t('language.selectLanguage')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Language options */}
          <View style={{ paddingVertical: 8 }}>
            {languages.map((lang: { code: Language; name: string; nativeName: string; flag: string }) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleSelectLanguage(lang.code)}
                disabled={isLoading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 28, marginRight: 16 }}>{lang.flag}</Text>
                  <View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: colors.foreground
                    }}>
                      {lang.nativeName}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: colors.mutedForeground,
                      marginTop: 2
                    }}>
                      {lang.name}
                    </Text>
                  </View>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
