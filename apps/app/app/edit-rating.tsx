'use client'

import BottomButtons from '@/components/ui/BottomButtons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAppToast } from '@/components/ui/Toast';
import {
  BROWSABLE_RATING_VALUES,
  formatRating,
  getRatingColor,
  getRatingInfoTranslated,
} from '@/constants/tennis-ratings';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPlayerProfile } from '@/lib/actions/player.actions';
import {
  canSubmitRatingChangeRequest,
  sendRatingChangeRequestEmail,
  submitRatingChangeRequest
} from '@/lib/actions/rating-change-requests.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { router } from 'expo-router';
import { ArrowDown } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function EditRating() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { showToast } = useAppToast();
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentRating, setCurrentRating] = useState(2.0);
  const [requestedRating, setRequestedRating] = useState(2.0);
  const [reason, setReason] = useState('');
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [lastRequestDate, setLastRequestDate] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPlayerData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await getPlayerProfile(user.id);
      if (profile) {
        setPlayerProfile(profile);
        setCurrentRating(profile.rating || 2.0);
        setRequestedRating(profile.rating || 2.0);
      }

      const { canSubmit: eligible, lastRequestDate: lastDate } = await canSubmitRatingChangeRequest(profile.id);
      setCanSubmit(eligible);
      setLastRequestDate(lastDate);
    } catch (error) {
      showToast(t('editRating.loadError'), { type: 'error' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleRatingChange = (direction: 1 | -1) => {
    const currentIndex = BROWSABLE_RATING_VALUES.indexOf(requestedRating);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < BROWSABLE_RATING_VALUES.length) {
      setRequestedRating(BROWSABLE_RATING_VALUES[newIndex]);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user || !playerProfile) return;

    if (requestedRating === currentRating) {
      showToast(t('editRating.sameRatingError'), { type: 'error' });
      return;
    }

    if (!reason.trim()) {
      showToast(t('editRating.noReason'), { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await submitRatingChangeRequest(
        playerProfile.id,
        currentRating,
        requestedRating,
        reason.trim()
      );

      if (!success) {
        showToast(error || tErrors('generic.tryAgain'), { type: 'error' });
        return;
      }

      const emailResult = await sendRatingChangeRequestEmail(
        `${playerProfile.first_name} ${playerProfile.last_name}`.trim(),
        user.email || '',
        currentRating,
        requestedRating,
        reason.trim()
      );

      if (emailResult.success) {
        showToast(t('editRating.requestSuccess'), { type: 'success' });
      } else {
        showToast(t('editRating.requestSuccessEmailError'), { type: 'success' });
      }
      router.back();
    } catch (error) {
      showToast(tErrors('generic.tryAgain'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const currentRatingInfo = getRatingInfoTranslated(currentRating, tCommon);
  const currentRatingColor = getRatingColor(currentRating);
  const currentDisplayRating = formatRating(currentRating);

  const requestedRatingInfo = getRatingInfoTranslated(requestedRating, tCommon);
  const requestedRatingColor = getRatingColor(requestedRating);
  const requestedDisplayRating = formatRating(requestedRating);

  const isDifferentRating = requestedRating !== currentRating;
  const hasValidRequest = reason.trim().length > 0 && isDifferentRating;

  const formatLastRequestDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canDecrement = BROWSABLE_RATING_VALUES.indexOf(requestedRating) > 0;
  const canIncrement = BROWSABLE_RATING_VALUES.indexOf(requestedRating) < BROWSABLE_RATING_VALUES.length - 1;

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('editRating.title')}
          onBack={handleCancel}
        />
        <LoadingSpinner variant="overlay" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('editRating.title')}
        onBack={handleCancel}
      />

      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        {/* Cooldown notice */}
        {!canSubmit && lastRequestDate && (
          <View style={{
            backgroundColor: colors.muted,
            padding: 16,
            borderRadius: 12,
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
              {t('editRating.lastRequest', { date: formatLastRequestDate(lastRequestDate) })}
            </Text>
          </View>
        )}

        {canSubmit && (
          <>
            {/* Current Rating Card */}
            <View style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.mutedForeground,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {t('editRating.currentRating')}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <View style={{
                  backgroundColor: currentRatingColor,
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                  borderRadius: 16
                }}>
                  <Text style={{ color: '#000', fontSize: 14, fontWeight: '600' }}>
                    {currentRatingInfo.level}
                  </Text>
                </View>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.foreground }}>
                  {currentDisplayRating}
                </Text>
              </View>

              <Text style={{
                fontSize: 13,
                lineHeight: 18,
                color: colors.mutedForeground,
                textAlign: 'center'
              }}>
                {currentRatingInfo.description}
              </Text>
            </View>

            {/* Down arrow separator */}
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <ArrowDown size={24} color={colors.mutedForeground} />
            </View>

            {/* Requested Rating Card with Stepper */}
            <View style={{
              backgroundColor: colors.card,
              borderWidth: 2,
              borderColor: isDifferentRating ? requestedRatingColor : colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 8
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.mutedForeground,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {t('editRating.requestedRating')}
              </Text>

              <Text style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginBottom: 12,
                textAlign: 'center',
              }}>
                {t('editRating.selectLevel')}
              </Text>

              {/* Level Badge */}
              <View style={{
                backgroundColor: requestedRatingColor,
                paddingHorizontal: 20,
                paddingVertical: 6,
                borderRadius: 16,
                marginBottom: 16,
              }}>
                <Text style={{ color: '#000', fontSize: 14, fontWeight: '600' }}>
                  {requestedRatingInfo.level}
                </Text>
              </View>

              {/* Stepper Controls */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32, marginBottom: 16 }}>
                <TouchableOpacity
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    backgroundColor: canDecrement ? requestedRatingColor : colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleRatingChange(-1)}
                  disabled={!canDecrement}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: canDecrement ? '#000' : colors.mutedForeground, fontSize: 28, fontWeight: '600', lineHeight: 28 }}>−</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 40, fontWeight: 'bold', color: colors.foreground, minWidth: 80, textAlign: 'center' }}>
                  {requestedDisplayRating}
                </Text>

                <TouchableOpacity
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    backgroundColor: canIncrement ? requestedRatingColor : colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleRatingChange(1)}
                  disabled={!canIncrement}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: canIncrement ? '#000' : colors.mutedForeground, fontSize: 28, fontWeight: '600', lineHeight: 28 }}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Rating Description */}
              <Text style={{
                fontSize: 13,
                lineHeight: 18,
                color: colors.mutedForeground,
                textAlign: 'center'
              }}>
                {requestedRatingInfo.description}
              </Text>
            </View>

            {/* Reason Input */}
            <View style={{ marginTop: 16, marginBottom: 32 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 8
              }}>
                {t('editRating.reasonLabel')}
              </Text>
              <Text style={{
                fontSize: 13,
                color: colors.mutedForeground,
                marginBottom: 8,
              }}>
                {t('editRating.reviewInfo')}
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  paddingTop: 16,
                  fontSize: 16,
                  color: colors.foreground,
                  textAlignVertical: 'top',
                  minHeight: 100,
                  lineHeight: 22,
                }}
                value={reason}
                onChangeText={setReason}
                placeholder={t('editRating.reasonPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        )}
      </ScrollView>

      <BottomButtons
        onCancel={handleCancel}
        onSave={canSubmit ? handleSubmitRequest : () => {}}
        loading={loading}
        disabled={!canSubmit || !hasValidRequest}
        saveText={t('editRating.submitRequest')}
      />
    </SafeAreaView>
  );
}
