  'use client'

import { OnboardingButtons, OnboardingLayout } from '@/components/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createOrUpdatePlayerProfile } from '@/lib/actions/player.actions';
import { AvailabilityData, DayOfWeek, TimeSlot } from '@/lib/database.types';
import { getThemeColors } from '@/lib/utils/theme';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppToast } from '@/components/ui/Toast';

const DAYS_OF_WEEK: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

export default function Availability() {
  const { user, refreshUser } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { showToast } = useAppToast();

  const [loading, setLoading] = React.useState(false);
  const [availability, setAvailability] = React.useState<AvailabilityData>({});

  const toggleTimeSlot = (day: DayOfWeek, slot: TimeSlot) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const newDaySlots = daySlots.includes(slot)
        ? daySlots.filter(s => s !== slot)
        : [...daySlots, slot];
      
      return {
        ...prev,
        [day]: newDaySlots.length > 0 ? newDaySlots : undefined,
      };
    });
  };

  const isSlotSelected = (day: DayOfWeek, slot: TimeSlot) => {
    return availability[day]?.includes(slot) || false;
  };

  const hasAnySelection = () => {
    return Object.values(availability).some(slots => slots && slots.length > 0);
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Clean up the availability object to remove empty arrays
      const cleanedAvailability = Object.entries(availability).reduce((acc, [day, slots]) => {
        if (slots && slots.length > 0) {
          acc[day as DayOfWeek] = slots;
        }
        return acc;
      }, {} as AvailabilityData);

      const { error } = await createOrUpdatePlayerProfile(user.id, {
        availability: cleanedAvailability,
        onboarding_completed: true,
      });

      if (error) {
        showToast(t('availability.saveError'), { type: 'error' });
      } else {
        // Refresh user context to trigger re-check in AuthGuard
        refreshUser();

        // Add a small delay to ensure database update is propagated
        setTimeout(() => {
          // Navigate to main app
          router.replace('/(tabs)/community');
        }, 500);
      }
    } catch (error) {
      showToast(tErrors('generic.tryAgain'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

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
        title={t('availability.title')}
        subtitle={t('availability.subtitle')}
        scrollable={false}
        showBottomSpace={false}
        buttons={
          <OnboardingButtons
            onContinue={handleComplete}
            continueText={tCommon('buttons.continue')}
            loading={loading}
            continueDisabled={!hasAnySelection()}
            continueStyle={hasAnySelection() ? 'primary' : 'primary'}
            hideBack
          />
        }
      >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{t(`availability.days.${day}`)}</Text>
              <View style={styles.slotsContainer}>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = isSlotSelected(day, slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotButton,
                        isSelected && styles.slotButtonSelected,
                      ]}
                      onPress={() => toggleTimeSlot(day, slot)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.slotButtonText,
                          isSelected && styles.slotButtonTextSelected,
                        ]}
                      >
                        {t(`availability.${slot}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <Text style={styles.helperText}>
            {t('availability.helperText')}
          </Text>
        </View>
      </ScrollView>
    </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120, // Space for buttons
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    width: 60,
  },
  slotsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  slotButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 24,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    alignItems: 'center',
  },
  slotButtonSelected: {
    backgroundColor: '#84cc16',
    borderColor: '#84cc16',
  },
  slotButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  slotButtonTextSelected: {
    color: '#000',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
}); 