'use client'

import { OnboardingButtons, OnboardingLayout } from '@/components/onboarding';
import { formatRating, getRatingColor, getRatingInfoTranslated } from '@/constants/tennis-ratings';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function RatingSelection() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');

  const [selectedRating, setSelectedRating] = useState(2.0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await getPlayerProfile(user.id);
    if (data && data.rating) {
      setSelectedRating(data.rating);
    }
  };

  const handleRatingChange = (increment: number) => {
    const newRating = selectedRating + increment;
    
    // Handle the special case for 5.0+
    if (selectedRating === 5.0 && increment > 0) {
      setSelectedRating(5.5); // Use 5.5 to represent +5.0
    } else if (selectedRating > 5.0 && increment < 0) {
      setSelectedRating(5.0);
    } else if (newRating >= 1.0 && newRating <= 5.0) {
      setSelectedRating(newRating);
    }
  };

  const handleContinue = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await createOrUpdatePlayerProfile(user.id, {
        rating: selectedRating,
      });

      if (error) {
        Alert.alert(tErrors('generic.somethingWentWrong'), t('rating.saveError'));
        console.error('Rating save error:', error);
      } else {
        router.push('/onboarding/availability' as any);
      }
    } catch (error) {
      Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
      console.error('Rating save exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const ratingInfo = getRatingInfoTranslated(selectedRating, tCommon);
  const ratingColor = getRatingColor(selectedRating);
  const displayRating = formatRating(selectedRating);

  return (
    <>
      {/* Back Button - Absolute positioned at top-left */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: insets.top + 16,
          left: 20,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 4,
          zIndex: 10,
        }}
        onPress={handleBack}
      >
        <ArrowLeft size={20} color={colors.foreground} />
        <Text style={{
          marginLeft: 8,
          fontSize: 16,
          color: colors.foreground,
          fontWeight: '500',
        }}>
          {tCommon('buttons.back')}
        </Text>
      </TouchableOpacity>

      <OnboardingLayout
        title={t('rating.title')}
        subtitle={t('rating.subtitle')}
        scrollable={false}
        buttons={
          <OnboardingButtons
            onContinue={handleContinue}
            loading={loading}
            hideBack
          />
        }
      >
      <View style={styles.content}>
        {/* Rating Selector */}
        <View style={styles.ratingContainer}>
          {/* Level Badge */}
          <View style={[styles.levelBadge, { backgroundColor: ratingColor }]}>
            <Text style={styles.levelText}>{ratingInfo.level}</Text>
          </View>

          {/* Rating Controls */}
          <View style={styles.ratingControls}>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: ratingColor }]}
              onPress={() => handleRatingChange(-0.5)}
              disabled={selectedRating <= 1.0}
              activeOpacity={0.7}
            >
              <Text style={styles.ratingButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.ratingValue}>{displayRating}</Text>

            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: ratingColor }]}
              onPress={() => handleRatingChange(0.5)}
              disabled={selectedRating > 5.0}
              activeOpacity={0.7}
            >
              <Text style={styles.ratingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rating Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>
            {t('rating.ratingIsIf', { rating: displayRating })}
          </Text>
          <Text style={[styles.descriptionText, { color: colors.mutedForeground }]}>
            {ratingInfo.description}
          </Text>
        </View>
      </View>
    </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: 40,
  },
  levelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  levelText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  ratingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  ratingButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonText: {
    color: '#000',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 32,
  },
  ratingValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 140,
    textAlign: 'center',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
  },
  descriptionTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 16,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 18,
    lineHeight: 28,
  },
}); 