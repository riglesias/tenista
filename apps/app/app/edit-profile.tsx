'use client'

import AvatarPicker from '@/components/ui/AvatarPicker';
import BottomButtons from '@/components/ui/BottomButtons';
import { RadioButton } from '@/components/ui/RadioButton';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function EditProfile() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation('profile');
  const { t: tErrors } = useTranslation('errors');
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female' | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  
  // Create refs for input fields
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  useEffect(() => {
    loadCurrentProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCurrentProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await getPlayerProfile(user.id);
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setGender(data.gender);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error loading player profile:', error);
      Alert.alert(tErrors('generic.somethingWentWrong'), t('edit.saveError'));
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAvatarChange = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!firstName || !lastName || !gender) {
      Alert.alert(t('edit.requiredFields'), t('edit.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await createOrUpdatePlayerProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        gender,
        avatar_url: avatarUrl,
      });

      if (error) {
        Alert.alert(tErrors('generic.somethingWentWrong'), t('edit.saveError'));
        console.error('Profile save error:', error);
      } else {
        Alert.alert(tErrors('generic.success'), t('edit.saveSuccess'), [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
      console.error('Profile save exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const focusNextField = () => {
    lastNameRef.current?.focus();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isFormValid = firstName && lastName && gender;

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('edit.title')}
          onBack={handleCancel}
        />
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className={`text-base mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('edit.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('edit.title')}
        onBack={handleCancel}
      />

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className={`text-base mb-8 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('edit.subtitle')}
        </Text>

        {/* Profile Image */}
        {user && (
          <View className="items-center mb-8">
            <AvatarPicker
              avatarUrl={avatarUrl}
              onAvatarChange={handleAvatarChange}
              userId={user.id}
              firstName={firstName || 'P'}
              size={120}
              showEditButton={true}
            />
          </View>
        )}

        {/* First Name */}
        <View className="mb-6">
          <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('edit.firstName')}
          </Text>
          <TextInput
            ref={firstNameRef}
            className={`h-14 px-4 rounded-xl border text-md ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('edit.firstNamePlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
            onSubmitEditing={focusNextField}
            blurOnSubmit={false}
            textAlignVertical="center"
          />
        </View>

        {/* Last Name */}
        <View className="mb-6">
          <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('edit.lastName')}
          </Text>
          <TextInput
            ref={lastNameRef}
            className={`h-14 px-4 rounded-xl border text-md ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('edit.lastNamePlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            onSubmitEditing={dismissKeyboard}
            textAlignVertical="center"
          />
        </View>

        {/* Gender */}
        <View className="mb-8">
          <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('edit.gender')}
          </Text>
          <View className="flex-row gap-8 mb-2">
            <RadioButton
              value="male"
              label={t('edit.male')}
              selected={gender === 'male'}
              onPress={(value) => setGender(value as 'male')}
            />
            <RadioButton
              value="female"
              label={t('edit.female')}
              selected={gender === 'female'}
              onPress={(value) => setGender(value as 'female')}
            />
          </View>
          <TouchableOpacity onPress={() => Alert.alert(t('edit.genderInfoTitle'), t('edit.genderInfoMessage'))}>
            <Text className={`text-sm mt-1 underline ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('edit.whyGender')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomButtons
        onCancel={handleCancel}
        onSave={handleSave}
        loading={loading}
        disabled={!isFormValid}
        saveText={t('edit.save')}
      />
    </SafeAreaView>
  );
} 