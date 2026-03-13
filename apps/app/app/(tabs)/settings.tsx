'use client'

import AvatarPicker from '@/components/ui/AvatarPicker';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import DeleteAccountModal from '@/components/ui/DeleteAccountModal';
import LanguageSelectionSheet from '@/components/ui/LanguageSelectionSheet';
import CountryFlag from '@/components/ui/CountryFlag';
import { useAppToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage, languages } from '@/contexts/LanguageContext';
import { getCourtById } from '@/lib/actions/courts.actions';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Helper function to format member since date
function formatMemberSince(createdAt: string, locale: string = 'en-US'): string {
  const date = new Date(createdAt);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long'
  };
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES'
  };
  return date.toLocaleDateString(localeMap[locale] || 'en-US', options);
}

export default function SettingsScreen() {
  const { setIsDark, isDark, theme } = useTheme();
  const { signOut, user, deleteAccount } = useAuth();
  const { enableNotifications, disableNotifications, hasPermission } = useNotifications();
  const { language } = useLanguage();
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { showToast } = useAppToast();
  const { confirm } = useConfirmDialog();
  const colors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [homecourt, setHomecourt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [matchResultNotificationLoading, setMatchResultNotificationLoading] = useState(false);
  const [playNowNotificationsEnabled, setPlayNowNotificationsEnabled] = useState(false);
  const [matchResultNotificationsEnabled, setMatchResultNotificationsEnabled] = useState(false);

  // Get current language display info
  const currentLanguageInfo = languages.find((l: { code: string }) => l.code === language) || languages[0];

  const loadPlayerProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    
    try {
      setProfileError(null);
      const { data, error } = await getPlayerProfile(user.id);
      
      if (error) {
        setProfileError(t('alerts.failedToLoadProfile'));
      } else {
        setPlayerProfile(data);
        
        // Set notification states
        setPlayNowNotificationsEnabled(data?.play_now_notifications_enabled || false);
        setMatchResultNotificationsEnabled(data?.match_result_notifications_enabled || false);
        
        // Load homecourt information if player has one
        if (data?.homecourt_id) {
          if (data.homecourt_id === 'other') {
            // Handle "Other" homecourt selection
            setHomecourt({ name: 'Other', is_public: null });
          } else {
            const { data: courtData } = await getCourtById(data.homecourt_id);
            if (courtData) {
              setHomecourt(courtData);
            }
          }
        } else {
          setHomecourt(null);
        }
      }
    } catch (error) {
      setProfileError(t('alerts.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useFocusEffect(
    useCallback(() => {
      // Always reload to get the latest data when screen comes into focus
      loadPlayerProfile();
    }, [loadPlayerProfile])
  );

  const handleAvatarChange = async (newAvatarUrl: string) => {
    if (!user) return;
    
    try {
      // Update the profile in the database immediately
      const { error: updateError } = await createOrUpdatePlayerProfile(user.id, {
        avatar_url: newAvatarUrl,
      });
      
      if (updateError) {
        showToast(t('alerts.updateError'), { type: 'error' });
      } else {
        // Update local state
        setPlayerProfile((prev: any) => prev ? { ...prev, avatar_url: newAvatarUrl } : prev);
      }
    } catch (error) {
      showToast(t('alerts.avatarError'), { type: 'error' });
    }
  };

  const handleThemeToggle = (value: boolean) => {
    setIsDark(value);
  };

  const handleNotificationToggle = async (value: boolean) => {
    // Update local state immediately for smooth UI
    setPlayNowNotificationsEnabled(value);
    setNotificationLoading(true);
    
    try {
      // Update the database preference
      const { error } = await supabase
        .from('players')
        .update({ play_now_notifications_enabled: value })
        .eq('auth_user_id', user?.id);

      if (error) {
        throw error;
      }

      // Update playerProfile state as well
      setPlayerProfile((prev: any) => prev ? { ...prev, play_now_notifications_enabled: value } : prev);

      // Handle notification permissions if enabling
      if (value) {
        await enableNotifications();
      } else {
        await disableNotifications();
      }
    } catch (error) {
      showToast(t('alerts.notificationError'), { type: 'error' });
      // Revert the local state on error
      setPlayNowNotificationsEnabled(!value);
      setPlayerProfile((prev: any) => prev ? { ...prev, play_now_notifications_enabled: !value } : prev);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleMatchResultNotificationToggle = async (value: boolean) => {
    // Update local state immediately for smooth UI
    setMatchResultNotificationsEnabled(value);
    setMatchResultNotificationLoading(true);
    
    try {
      // Update the database preference
      const { error } = await supabase
        .from('players')
        .update({ match_result_notifications_enabled: value })
        .eq('auth_user_id', user?.id);

      if (error) {
        throw error;
      }

      // Update playerProfile state as well
      setPlayerProfile((prev: any) => prev ? { ...prev, match_result_notifications_enabled: value } : prev);

      // If enabling, ensure push notification permissions and token registration
      if (value) {
        await enableNotifications();
      }
    } catch (error) {
      showToast(t('alerts.notificationError'), { type: 'error' });
      // Revert the local state on error
      setMatchResultNotificationsEnabled(!value);
      setPlayerProfile((prev: any) => prev ? { ...prev, match_result_notifications_enabled: !value } : prev);
    } finally {
      setMatchResultNotificationLoading(false);
    }
  };

  // Check if Play Now notifications are enabled in player profile
  useEffect(() => {
    if (playerProfile?.play_now_notifications_enabled && hasPermission) {
      enableNotifications().catch(() => { /* silently handled */ });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerProfile?.play_now_notifications_enabled, hasPermission]);

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        showToast(t('alerts.logoutError'), { type: 'error' });
      } else {
        router.replace('/(auth)/sign-in');
      }
    } catch (error) {
      showToast(t('alerts.unexpectedError'), { type: 'error' });
    }
  };

  const confirmLogout = () => {
    confirm({
      title: t('alerts.logoutConfirmTitle'),
      message: t('alerts.logoutConfirmMessage'),
      confirmText: t('account.logout'),
      cancelText: tCommon('buttons.cancel'),
      destructive: true,
      onConfirm: handleLogout,
    });
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const result = await deleteAccount();

      if (result.success) {
        showToast(t('alerts.accountDeleted') || 'Account successfully deleted.', { type: 'success' });
        router.replace('/(auth)/sign-in');
      } else {
        const errorMessage = result.error || 'Failed to delete account';
        showToast(errorMessage, { type: 'error' });
      }
    } catch (error) {
      showToast('An unexpected error occurred while deleting your account.', { type: 'error' });
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  // Skeleton component for loading states
  const SkeletonCard = ({ height = 80 }: { height?: number }) => (
    <View style={{ 
      backgroundColor: colors.card, 
      borderWidth: 1, 
      borderColor: colors.border, 
      borderRadius: 12, 
      padding: 20,
      height: height,
      justifyContent: 'center'
    }}>
      <View style={{
        height: 16,
        backgroundColor: colors.muted,
        borderRadius: 8,
        marginBottom: 8,
        width: '60%'
      }} />
      <View style={{
        height: 12,
        backgroundColor: colors.muted,
        borderRadius: 6,
        width: '40%'
      }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16 }}>
        <Text style={[theme.typography.h2, { color: colors.foreground }]}>
          {t('title')}
        </Text>
      </View>
      
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 24 }}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 100 + insets.bottom : 100
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar - Show even during loading */}
        <View style={{ marginBottom: 24 }}>
          {!loading && playerProfile && user ? (
            <AvatarPicker
              avatarUrl={playerProfile.avatar_url}
              onAvatarChange={handleAvatarChange}
              userId={user.id}
              firstName={playerProfile.first_name || 'P'}
              size={96}
              showEditButton={true}
            />
          ) : loading ? (
            // Skeleton for avatar
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colors.muted,
              }} />
            </View>
          ) : (
            // Error state - show generic avatar
            user && (
              <AvatarPicker
                avatarUrl={null}
                onAvatarChange={handleAvatarChange}
                userId={user.id}
                firstName="P"
                size={96}
                showEditButton={true}
                disabled={true}
              />
            )
          )}
        </View>


        {/* Profile Card */}
        <View style={{ marginBottom: 32 }}>
          {loading ? (
            <SkeletonCard height={100} />
          ) : profileError ? (
            <View style={{ 
              backgroundColor: colors.card, 
              borderWidth: 1, 
              borderColor: colors.border, 
              borderRadius: 12, 
              padding: 20,
              alignItems: 'center'
            }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                {profileError}
              </Text>
              <TouchableOpacity 
                onPress={loadPlayerProfile}
                style={{ 
                  marginTop: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.primary,
                  borderRadius: 8
                }}
              >
                <Text style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: '600' }}>
                  {tCommon('buttons.retry')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : playerProfile ? (
            <View style={{ 
              backgroundColor: colors.card, 
              borderWidth: 1, 
              borderColor: colors.border, 
              borderRadius: 12, 
              padding: 20 
            }}>
              <View style={{ alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <CountryFlag
                    countryCode={playerProfile.nationality_code}
                    size="lg"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 20, fontWeight: '600', color: colors.foreground }}>
                    {playerProfile.first_name} {playerProfile.last_name}
                  </Text>
                </View>
                {user?.email && (
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, marginBottom: 4 }}>
                    {user.email}
                  </Text>
                )}
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginBottom: 4 }}>
                  {homecourt ? homecourt.name : t('profile.noHomecourt')}
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                  {t('profile.memberSince', { date: formatMemberSince(playerProfile.created_at, language) })}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Profile Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
            {t('profile.title')}
          </Text>
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, gap: 16 }}>
            <TouchableOpacity
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('profile.editProfile')}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/edit-availability')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('profile.editAvailability')}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/edit-location')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('profile.editLocation')}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/edit-homecourt')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons
                    name="tennisball-outline"
                    size={20}
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('profile.editHomecourtAndClub')}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/edit-flag')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons
                    name="flag-outline"
                    size={20}
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('profile.editFlag')}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/edit-rating')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons
                    name="star-outline"
                    size={20}
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('profile.editRating')}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
            {t('language.title')}
          </Text>

          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16 }}>
            <TouchableOpacity
              onPress={() => setShowLanguageSheet(true)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Text style={{ fontSize: 20 }}>{currentLanguageInfo.flag}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {currentLanguageInfo.nativeName}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                    {currentLanguageInfo.name}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
            {t('appearance.title')}
          </Text>
          
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons 
                    name={isDark ? 'moon' : 'sunny'} 
                    size={20} 
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('appearance.darkMode')}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                    {isDark ? t('appearance.darkThemeEnabled') : t('appearance.lightThemeEnabled')}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
            {t('notifications.title')}
          </Text>
          
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, gap: 16 }}>
            {/* Play Now Notifications */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons 
                    name="notifications-outline" 
                    size={20} 
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('notifications.playNow')}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                    {t('notifications.playNowDescription')}
                  </Text>
                </View>
              </View>
              <Switch
                value={playNowNotificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
                disabled={notificationLoading}
              />
            </View>

            {/* Match Result Notifications */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: colors.muted }}>
                  <Ionicons 
                    name="trophy-outline" 
                    size={20} 
                    color={colors.foreground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {t('notifications.matchResult')}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                    {t('notifications.matchResultDescription')}
                  </Text>
                </View>
              </View>
              <Switch
                value={matchResultNotificationsEnabled}
                onValueChange={handleMatchResultNotificationToggle}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
                disabled={matchResultNotificationLoading}
              />
            </View>

            {(Platform.OS === 'web' || __DEV__) && (
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 12, fontStyle: 'italic' }}>
                {Platform.OS === 'web'
                  ? t('notifications.webNotAvailable')
                  : t('notifications.devBuildRequired')}
              </Text>
            )}
          </View>
        </View>

        {/* Account Management Section */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
            {t('account.title')}
          </Text>

          <View style={{ gap: 12 }}>
            {/* Delete Account Button */}
            <TouchableOpacity
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
              disabled={deletingAccount}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: '#ef4444',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: deletingAccount ? 0.6 : 1
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                {deletingAccount ? t('account.deletingAccount') : t('account.deleteAccount')}
              </Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={confirmLogout}
              activeOpacity={0.7}
              disabled={deletingAccount}
              style={{
                backgroundColor: colors.destructive,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: deletingAccount ? 0.6 : 1
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.destructiveForeground} />
              <Text style={{ color: colors.destructiveForeground, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                {t('account.logout')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Version Information */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: 'center'
            }}>
              {t('version', {
                version: Constants.expoConfig?.version || '1.0.0',
                buildNumber: Platform.OS === 'ios' ? Constants.expoConfig?.ios?.buildNumber || '1' : Constants.expoConfig?.android?.versionCode || '1'
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Selection Sheet */}
      <LanguageSelectionSheet
        visible={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deletingAccount}
      />
    </View>
  );
}  