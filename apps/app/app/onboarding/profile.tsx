'use client'

import { OnboardingButtons, OnboardingLayout, createOnboardingStyles, ProfileFormSkeleton } from '@/components/onboarding';
import AvatarPicker from '@/components/ui/AvatarPicker';
import { RadioButton } from '@/components/ui/RadioButton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    BackHandler,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function ProfileOnboarding() {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const onboardingStyles = createOnboardingStyles(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Create refs for input fields
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLogout();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    // Load existing profile data if available
    const loadProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      // Add minimum loading time to prevent flash
      const minimumLoadTime = new Promise(resolve => setTimeout(resolve, 300));

      try {
        const [profileResult] = await Promise.all([
          getPlayerProfile(user.id),
          minimumLoadTime
        ]);

        if (profileResult.data) {
          setFirstName(profileResult.data.first_name || '');
          setLastName(profileResult.data.last_name || '');
          setGender(profileResult.data.gender);
          setAvatarUrl(profileResult.data.avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleAvatarChange = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
  };

  const handleContinue = async () => {
    if (!user) return;

    if (!firstName || !lastName || !gender) {
      Alert.alert(tErrors('validation.required'), tErrors('validation.required'));
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
        Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
        console.error('Profile save error:', error);
      } else {
        router.push('/onboarding/flag-selection' as any);
      }
    } catch (error) {
      Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
      console.error('Profile save exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
    }
  };

  const focusNextField = () => {
    lastNameRef.current?.focus();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Check if user has Apple sign-in (including linked accounts)
  const hasAppleSignIn = () => {
    const appMetadata = user?.app_metadata || {};
    return appMetadata.provider === 'apple' ||
           (appMetadata.providers && appMetadata.providers.includes('apple'));
  };

  const isFormValid = firstName && lastName && gender;

  return (
    <View style={{ flex: 1 }}>
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
        onPress={handleLogout}
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
        title={t('profile.title')}
        keyboardAware
        buttons={
          <OnboardingButtons
            onContinue={handleContinue}
            loading={loading}
            continueDisabled={!isFormValid}
            hideBack
          />
        }
      >
      {isLoadingProfile ? (
        // Show skeleton while loading profile data
        <ProfileFormSkeleton />
      ) : (
        <>
          {/* Profile Image - Using reusable component */}
          {user && (
            <View style={styles.imageContainer}>
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

          {/* Name Fields - Always show as separate editable fields */}
          {/* First Name */}
          <View style={onboardingStyles.fieldContainer}>
            <Text style={onboardingStyles.label}>{t('profile.firstName')}</Text>
            <TextInput
              ref={firstNameRef}
              style={onboardingStyles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('profile.firstNamePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="next"
              onSubmitEditing={focusNextField}
              blurOnSubmit={false}
            />
          </View>

          {/* Last Name */}
          <View style={onboardingStyles.fieldContainer}>
            <Text style={onboardingStyles.label}>{t('profile.lastName')}</Text>
            <TextInput
              ref={lastNameRef}
              style={onboardingStyles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('profile.lastNamePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
            />
          </View>

          {/* Show helper text if Apple Sign-In provided the name */}
          {hasAppleSignIn() && firstName && lastName && (
            <Text style={{
              color: colors.mutedForeground,
              fontSize: 12,
              marginTop: -8,
              marginBottom: 16,
              paddingHorizontal: 16,
            }}>
              {t('profile.appleSignInHelper')}
            </Text>
          )}

          {/* Gender */}
          <View style={onboardingStyles.fieldContainer}>
            <Text style={onboardingStyles.label}>{t('profile.gender')}</Text>
            <View style={styles.radioGroup}>
              <RadioButton
                value="male"
                label={t('profile.male')}
                selected={gender === 'male'}
                onPress={(value) => setGender(value as 'male')}
              />
              <RadioButton
                value="female"
                label={t('profile.female')}
                selected={gender === 'female'}
                onPress={(value) => setGender(value as 'female')}
              />
            </View>
            <TouchableOpacity onPress={() => Alert.alert(t('profile.genderInfoTitle'), t('profile.genderInfoMessage'))}>
              <Text style={{
                color: colors.mutedForeground,
                fontSize: 14,
                textDecorationLine: 'underline',
                marginTop: 4,
              }}>{t('profile.whyGender')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </OnboardingLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 8,
  },
});
