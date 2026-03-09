'use client'

import { OnboardingButtons, OnboardingLayout, createOnboardingStyles } from '@/components/onboarding';
import { countries, Country } from '@/constants/countries';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import SelectionBottomSheet from '@/components/ui/SelectionBottomSheet';
import CountryFlag from '@/components/ui/CountryFlag';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
// Helper function to detect user's country based on timezone
const getDefaultCountryFromLocale = (): Country | null => {
  try {
    // Get the user's current timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Simple timezone to country mapping for common cases
    const timezoneToCountry: { [key: string]: string } = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Phoenix': 'US',
      'America/Anchorage': 'US',
      'Pacific/Honolulu': 'US',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Europe/Amsterdam': 'NL',
      'Europe/Brussels': 'BE',
      'Europe/Vienna': 'AT',
      'Europe/Zurich': 'CH',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Seoul': 'KR',
      'Asia/Hong_Kong': 'HK',
      'Asia/Singapore': 'SG',
      'Asia/Mumbai': 'IN',
      'Asia/Dubai': 'AE',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
      'Australia/Brisbane': 'AU',
      'Australia/Perth': 'AU',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'America/Mexico_City': 'MX',
      'America/Sao_Paulo': 'BR',
      'America/Argentina/Buenos_Aires': 'AR',
      'America/Santiago': 'CL',
      'Europe/Moscow': 'RU',
      'Africa/Cairo': 'EG',
      'Africa/Johannesburg': 'ZA',
    };
    
    const countryCodeFromTimezone = timezoneToCountry[timezone];
    if (countryCodeFromTimezone) {
      const matchedCountry = countries.find(country => 
        country.code.toUpperCase() === countryCodeFromTimezone
      );
      
      if (matchedCountry) {
        return matchedCountry;
      }
    }
    
    // Final fallback: return United States as default
    return countries.find(country => country.code === 'US') || null;
    
  } catch (error) {
    console.log('Error detecting country from timezone:', error);
    // Return United States as fallback
    return countries.find(country => country.code === 'US') || null;
  }
};

export default function FlagSelection() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const onboardingStyles = createOnboardingStyles(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await getPlayerProfile(user.id);
    if (data) {
      // Set player name for the example display
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      setPlayerName(`${firstName} ${lastName?.[0] || ''}.`.trim());
      
      // Set selected country if already exists (check nationality_code for flag)
      if (data.nationality_code) {
        const country = countries.find(c => c.code === data.nationality_code);
        if (country) {
          setSelectedCountry(country);
          return; // Exit early if country is already set
        }
      }
    }
    
    // If no country is set, detect and set default based on user's locale
    const defaultCountry = getDefaultCountryFromLocale();
    if (defaultCountry) {
      setSelectedCountry(defaultCountry);
    }
  };

  const countryOptions = useMemo(() => {
    return countries.map(country => ({
      label: `${country.flag} ${country.name}`,
      value: country.code,
    }));
  }, []);

  const handleCountrySelect = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
    setIsBottomSheetOpen(false);
  };

  const handleContinue = async () => {
    if (!user) return;

    if (!selectedCountry) {
      Alert.alert(t('flag.requiredField'), t('flag.selectCountryMessage'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await createOrUpdatePlayerProfile(user.id, {
        nationality_code: selectedCountry.code,
        nationality_name: selectedCountry.name,
      });

      if (error) {
        Alert.alert(tErrors('generic.somethingWentWrong'), t('flag.saveError'));
        console.error('Country save error:', error);
      } else {
        router.push('/onboarding/location' as any);
      }
    } catch (error) {
      Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
      console.error('Country save exception:', error);
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
        title={t('flag.title')}
        subtitle={t('flag.subtitle')}
        scrollable={false}
        buttons={
          <OnboardingButtons
            onContinue={handleContinue}
            loading={loading}
            continueDisabled={!selectedCountry}
            hideBack
          />
        }
      >
      <View style={styles.content}>
        {/* Example match results */}
        <View style={[styles.exampleContainer, { backgroundColor: colors.card }]}>
          <View style={styles.exampleRow}>
            <View style={styles.playerInfo}>
              <CountryFlag countryCode={selectedCountry?.code} size="lg" />
              <Text style={[styles.playerName, { color: colors.foreground }]}>{playerName || 'Your Name'}</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: colors.mutedForeground }]}>0</Text>
              <Text style={[styles.score, { color: colors.mutedForeground }]}>0</Text>
              <Text style={[styles.score, { color: colors.mutedForeground }]}>0</Text>
            </View>
          </View>
          <View style={styles.exampleRow}>
            <View style={styles.playerInfo}>
              <CountryFlag countryCode="CH" size="lg" />
              <Text style={[styles.playerName, { color: colors.foreground }]}>Roger F.</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: colors.mutedForeground }]}>6</Text>
              <Text style={[styles.score, { color: colors.mutedForeground }]}>6</Text>
              <Text style={[styles.score, { color: colors.mutedForeground }]}>6</Text>
            </View>
          </View>
        </View>

        {/* Country selector */}
        <View style={styles.selectorSection}>
          <Text style={onboardingStyles.sectionTitle}>{t('flag.selectFlag')}</Text>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setIsBottomSheetOpen(true)}
            activeOpacity={0.7}
          >
            {selectedCountry ? (
              <>
                <CountryFlag countryCode={selectedCountry.code} size="lg" style={{ marginRight: 12 }} />
                <Text style={[styles.selectedName, { color: colors.foreground }]}>{selectedCountry.name}</Text>
              </>
            ) : (
              <>
                <Ionicons name="flag-outline" size={24} color={colors.mutedForeground} />
                <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>{t('flag.tapToSelect')}</Text>
              </>
            )}
            <Ionicons name="chevron-down" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Flag Selection Bottom Sheet */}
      <SelectionBottomSheet
        visible={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={t('flag.selectYourFlag')}
        options={countryOptions}
        selectedValue={selectedCountry?.code || null}
        onSelect={handleCountrySelect}
        searchable={true}
        placeholder={t('flag.searchPlaceholder')}
        emptyText={t('flag.noResults')}
      />
    </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  exampleContainer: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
  },
  scoreContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  score: {
    fontSize: 18,
    width: 20,
    textAlign: 'center',
  },
  selectorSection: {
    flex: 1,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  selectedName: {
    flex: 1,
    fontSize: 18,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
}); 