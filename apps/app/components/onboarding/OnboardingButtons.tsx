'use client'

import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { createOnboardingStyles } from './onboarding-styles';
import { useTranslation } from 'react-i18next';

interface OnboardingButtonsProps {
  onContinue?: () => void;
  onSkip?: () => void;
  continueText?: string;
  skipText?: string;
  loading?: boolean;
  continueDisabled?: boolean;
  continueStyle?: 'primary' | 'success';
  hideBack?: boolean;
}

export function OnboardingButtons({
  onContinue,
  onSkip,
  continueText,
  skipText,
  loading = false,
  continueDisabled = false,
  continueStyle = 'primary',
}: OnboardingButtonsProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const onboardingStyles = createOnboardingStyles(isDark);
  const { t } = useTranslation('onboarding');
  const displayText = continueText || t('common.continue');

  const continueButtonStyle = [
    onboardingStyles.continueButton,
    continueStyle === 'success' && { backgroundColor: colors.success || '#10b981' },
    (loading || continueDisabled) && onboardingStyles.disabledButton,
  ];

  const continueTextStyle = [
    onboardingStyles.continueButtonText,
    continueStyle === 'success' && { color: colors.successForeground || '#fff' },
  ];

  return (
    <View style={onboardingStyles.buttonContainer}>
      <TouchableOpacity
        style={continueButtonStyle}
        onPress={onContinue}
        disabled={loading || continueDisabled}
        activeOpacity={0.7}
      >
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator
              size="small"
              color={continueStyle === 'success' ? (colors.successForeground || '#fff') : colors.primaryForeground}
              style={{ marginRight: 8 }}
            />
            <Text style={continueTextStyle}>{t('common.saving')}</Text>
          </View>
        ) : (
          <Text style={continueTextStyle}>{displayText}</Text>
        )}
      </TouchableOpacity>
      {onSkip && (
        <TouchableOpacity
          onPress={onSkip}
          disabled={loading}
          activeOpacity={0.7}
          style={{ paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 16, fontWeight: '500' }}>
            {skipText || t('common.skip')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
} 