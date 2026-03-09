'use client'

import { OnboardingButtons, OnboardingLayout, createOnboardingStyles } from '@/components/onboarding';
import SelectionBottomSheet, { SelectionOption } from '@/components/ui/SelectionBottomSheet';
import { countries } from '@/constants/countries';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { formatPhoneNumber, getPhoneCode } from '@/lib/utils/onboarding-helpers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const onboardingStyles = createOnboardingStyles(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'US'));
  const [loading, setLoading] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isUS, setIsUS] = useState(true);
  const phoneInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await getPlayerProfile(user.id);
    if (data) {
      // Determine if user is in the US (for SMS vs WhatsApp styling)
      setIsUS(data.country_code === 'US' || !data.country_code);

      // Set phone data if already exists
      if (data.phone_number) {
        setPhoneNumber(data.phone_number);
      }
      if (data.phone_country_code) {
        setPhoneCountryCode(data.phone_country_code);
        // Find country by phone code
        const country = countries.find(c => getPhoneCode(c.code) === data.phone_country_code);
        if (country) {
          setSelectedCountry(country);
        }
      } else if (data.country_code) {
        // Use user's country as default for phone
        const country = countries.find(c => c.code === data.country_code);
        if (country) {
          setSelectedCountry(country);
          setPhoneCountryCode(getPhoneCode(country.code));
        }
      }
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text, phoneCountryCode));
  };

  const handleCountrySelect = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      setPhoneCountryCode(getPhoneCode(country.code));
    }
    setIsCountryModalOpen(false);
  };

  const handleContinue = async () => {
    if (!user) return;
    
    if (!phoneNumber) {
      Alert.alert(t('contact.requiredField'), t(isUS ? 'contact.enterPhoneNumber' : 'contact.enterPhoneNumberWhatsApp'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await createOrUpdatePlayerProfile(user.id, {
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber,
      });

      if (error) {
        Alert.alert(tErrors('generic.somethingWentWrong'), t('contact.saveError'));
        console.error('Phone save error:', error);
      } else {
        router.push('/onboarding/rating-selection' as any);
      }
    } catch (error) {
      Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
      console.error('Phone save exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const countryOptions = useMemo((): SelectionOption[] => {
    return countries.map(country => ({
      label: `${country.flag} ${country.name} ${getPhoneCode(country.code)}`,
      value: country.code
    }));
  }, []);

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
        title={t('contact.title')}
        subtitle={t(isUS ? 'contact.subtitle' : 'contact.subtitleWhatsApp')}
        keyboardAware
        buttons={
          <OnboardingButtons
            onContinue={handleContinue}
            loading={loading}
            hideBack
          />
        }
      >
      {/* Chat Example */}
      <View style={styles.chatExample}>
        <View style={styles.messageContainer}>
          <Text style={styles.senderName}>Roger F.</Text>
          <View style={[styles.messageBubbleLeft, { backgroundColor: isUS ? '#3b82f6' : '#075E54' }]}>
            <Text style={styles.messageText}>{t('contact.chatBubble1')}</Text>
          </View>
        </View>

        <View style={[styles.messageContainer, styles.messageRight]}>
          <Text style={[styles.senderName, styles.senderRight]}>Rafa N.</Text>
          <View style={[styles.messageBubbleRight, { backgroundColor: isUS ? '#10b981' : '#25D366' }]}>
            <Text style={styles.messageText}>{t('contact.chatBubble2')}</Text>
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.senderName}>Roger F.</Text>
          <View style={[styles.messageBubbleLeft, { backgroundColor: isUS ? '#3b82f6' : '#075E54' }]}>
            <Text style={styles.messageText}>{t('contact.chatBubble3')}</Text>
          </View>
        </View>
      </View>

      {/* Phone Number Input */}
      <View style={styles.phoneSection}>
        <Text style={onboardingStyles.sectionTitle}>{t(isUS ? 'contact.phone' : 'contact.phoneWhatsApp')}</Text>
        
        <View style={styles.phoneInputContainer}>
          <TouchableOpacity 
            style={[
              styles.countrySelector,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setIsCountryModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>{selectedCountry?.flag}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          
          <View style={[
            styles.phoneInputWrapper,
            {
              backgroundColor: colors.input,
              borderColor: colors.border,
            }
          ]}>
            <Text style={[
              styles.phoneCode,
              { color: colors.mutedForeground }
            ]}>{phoneCountryCode}</Text>
            <TextInput
              ref={phoneInputRef}
              style={[
                styles.phoneInput,
                { color: colors.foreground }
              ]}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              placeholder="123-456-7890"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={() => {
                phoneInputRef.current?.blur();
              }}
              maxLength={phoneCountryCode === '+1' ? 12 : 15}
            />
          </View>
        </View>
      </View>

      {/* Country Code Selection Bottom Sheet */}
      <SelectionBottomSheet
        visible={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        title={t('contact.selectCountryCode')}
        options={countryOptions}
        selectedValue={selectedCountry?.code || null}
        onSelect={handleCountrySelect}
        searchable={true}
        placeholder={t('contact.searchCountry')}
        emptyText={t('contact.noCountriesFound')}
      />
    </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  chatExample: {
    marginBottom: 40,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  senderRight: {
    textAlign: 'right',
  },
  messageBubbleLeft: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    maxWidth: '80%',
  },
  messageBubbleRight: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderTopRightRadius: 4,
    maxWidth: '80%',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 20,
  },
  phoneSection: {
    marginTop: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    minHeight: 48,
  },
  countryFlag: {
    fontSize: 20,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    minHeight: 48,
  },
  phoneCode: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
}); 