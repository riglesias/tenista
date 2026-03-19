'use client'

import BottomButtons from '@/components/ui/BottomButtons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAppToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { AvailabilityData, DayOfWeek, TimeSlot } from '@/lib/database.types';
import { getThemeColors } from '@/lib/utils/theme';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const DAYS_OF_WEEK: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

export default function EditAvailability() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { showToast } = useAppToast();
  const { t } = useTranslation('profile');
  const { t: tErrors } = useTranslation('errors');
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [availability, setAvailability] = React.useState<AvailabilityData>({});

  useEffect(() => {
    loadCurrentAvailability();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCurrentAvailability = async () => {
    if (!user) return;
    
    try {
      const { data } = await getPlayerProfile(user.id);
      if (data?.availability) {
        setAvailability(data.availability);
      }
    } catch (error) {
      showToast(t('editAvailability.loadError'), { type: 'error' });
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleSave = async () => {
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
      });

      if (error) {
        showToast(t('editAvailability.saveError'), { type: 'error' });
      } else {
        showToast(t('editAvailability.saveSuccess'), { type: 'success' });
        router.back();
      }
    } catch (error) {
      showToast(tErrors('generic.tryAgain'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('editAvailability.title')}
          onBack={handleCancel}
        />
        <LoadingSpinner variant="overlay" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('editAvailability.title')}
        onBack={handleCancel}
      />

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className={`text-base mb-8 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('editAvailability.subtitle')}
        </Text>

        <View>
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} className="flex-row items-center mb-4">
              <Text className={`text-md font-semibold w-10 mr-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t(`editAvailability.days.${day}`)}</Text>
              <View className="flex-1 flex-row gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = isSlotSelected(day, slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      className={`flex-1 py-3 px-2 rounded-3xl border items-center ${
                        isSelected
                          ? ''
                          : isDark
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-300'
                      }`}
                      style={isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } : undefined}
                      onPress={() => toggleTimeSlot(day, slot)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected
                            ? ''
                            : isDark
                              ? 'text-gray-400'
                              : 'text-gray-600'
                        }`}
                        style={isSelected ? { color: colors.primaryForeground } : undefined}
                      >
                        {t(`editAvailability.${slot}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomButtons
        onCancel={handleCancel}
        onSave={handleSave}
        loading={loading}
        saveText={t('edit.save')}
      />
    </SafeAreaView>
  );
} 