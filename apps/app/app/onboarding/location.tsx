'use client'

import { OnboardingButtons, OnboardingLayout, createOnboardingStyles } from '@/components/onboarding';
import SelectionBottomSheet, { SelectionOption } from '@/components/ui/SelectionBottomSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllCountriesWithCities, getCitiesByCountry } from '@/lib/actions/cities.actions';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppToast } from '@/components/ui/Toast';

interface City {
  id: string;
  name: string;
  state_province: string | null;
  country_code: string;
  country_name: string;
  player_count: number | null;
}

interface Country {
  country_code: string;
  country_name: string;
}

export default function LocationOnboarding() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const onboardingStyles = createOnboardingStyles(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { showToast } = useAppToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (selectedCountry) {
      loadCities(selectedCountry);
    }
  }, [selectedCountry]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load user's profile to check if they already have a location
      const { data: profile } = await getPlayerProfile(user.id);

      // Load all countries that have cities
      const { data: countriesData } = await getAllCountriesWithCities();
      if (countriesData) {
        setCountries(countriesData);
      }

      // Override default US only if user has a different country in profile
      if (profile?.country_code && profile.country_code !== 'US') {
        setSelectedCountry(profile.country_code);
      }

      // If user already has a city, pre-select it
      if (profile?.city_id) {
        const currentCountry = profile?.country_code || 'US';
        const { data: citiesData } = await getCitiesByCountry(currentCountry);
        if (citiesData) {
          const userCity = citiesData.find(city => city.id === profile.city_id);
          if (userCity) {
            setSelectedCity(userCity);
          }
        }
      }
    } catch (error) {
      // silently handled
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (countryCode: string) => {
    try {
      const { data } = await getCitiesByCountry(countryCode);
      if (data) {
        setCities(data);
      }
    } catch (error) {
      // silently handled
    }
  };

  const handleCitySelect = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setSelectedCity(city);
      setShowCitySheet(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedCity(null);
    setShowCountrySheet(false);
  };

  const handleContinue = async () => {
    if (!user || !selectedCity) {
      showToast(t('location.selectCityMessage'), { type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await createOrUpdatePlayerProfile(user.id, {
        city_id: selectedCity.id,
        city_name: selectedCity.name,
        state_province: selectedCity.state_province,
      });

      if (error) {
        showToast(t('location.saveError'), { type: 'error' });
      } else {
        router.push('/onboarding/homecourt' as any);
      }
    } catch (error) {
      showToast(tErrors('generic.tryAgain'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Create selection options
  const countryOptions: SelectionOption[] = countries.map(country => ({
    label: country.country_name,
    value: country.country_code
  }));

  const cityOptions: SelectionOption[] = cities.map(city => ({
    label: `${city.name}${city.state_province ? `, ${city.state_province}` : ''}`,
    value: city.id
  }));

  if (loading) {
    return (
      <OnboardingLayout
        title={t('location.title')}
        subtitle={t('location.subtitle')}
        scrollable={false}
      >
        <View style={onboardingStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={onboardingStyles.loadingText}>{t('location.loading')}</Text>
        </View>
      </OnboardingLayout>
    );
  }

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
        title={t('location.title')}
        subtitle={t('location.subtitle')}
        buttons={
          <OnboardingButtons
            onContinue={handleContinue}
            loading={saving}
            continueDisabled={!selectedCity}
            hideBack
          />
        }
      >
      {/* Country Selector */}
      <View style={styles.sectionContainer}>
        <Text style={onboardingStyles.sectionTitle}>{t('location.country')}</Text>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            {
              backgroundColor: colors.input,
              borderColor: colors.border,
            }
          ]}
          onPress={() => setShowCountrySheet(true)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.selectorText,
            { color: selectedCountry ? colors.foreground : colors.mutedForeground }
          ]}>
            {selectedCountry
              ? countries.find(c => c.country_code === selectedCountry)?.country_name || t('location.selectCountry')
              : t('location.selectCountry')
            }
          </Text>
          <Ionicons name="chevron-down" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* City Selector */}
      {selectedCountry && cities.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={onboardingStyles.sectionTitle}>
            {t('location.cityIn', { country: countries.find(c => c.country_code === selectedCountry)?.country_name })}
          </Text>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setShowCitySheet(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.selectorText,
              { color: selectedCity ? colors.foreground : colors.mutedForeground }
            ]}>
              {selectedCity
                ? `${selectedCity.name}${selectedCity.state_province ? `, ${selectedCity.state_province}` : ''}`
                : t('location.selectCity')
              }
            </Text>
            <Ionicons name="chevron-down" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* No Cities Available */}
      {selectedCountry && cities.length === 0 && (
        <View style={styles.sectionContainer}>
          <Text style={onboardingStyles.sectionTitle}>
            {t('location.citiesIn', { country: countries.find(c => c.country_code === selectedCountry)?.country_name })}
          </Text>
          <View style={[styles.noCitiesContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="location-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.noCitiesText, { color: colors.foreground }]}>
              {t('location.notAvailable')}
            </Text>
            <Text style={[styles.noCitiesSubtext, { color: colors.mutedForeground }]}>
              {t('location.expandingSoon')}
            </Text>
          </View>
        </View>
      )}

      {/* Country Selection Bottom Sheet */}
      <SelectionBottomSheet
        visible={showCountrySheet}
        onClose={() => setShowCountrySheet(false)}
        title={t('location.selectCountry')}
        options={countryOptions}
        selectedValue={selectedCountry}
        onSelect={handleCountryChange}
        searchable={true}
        placeholder={t('flag.searchPlaceholder')}
        emptyText={t('flag.noResults')}
      />

      {/* City Selection Bottom Sheet */}
      <SelectionBottomSheet
        visible={showCitySheet}
        onClose={() => setShowCitySheet(false)}
        title={t('location.selectCity')}
        options={cityOptions}
        selectedValue={selectedCity?.id || null}
        onSelect={handleCitySelect}
        searchable={true}
        placeholder={t('location.searchPlaceholder')}
        emptyText={t('location.noResults')}
      />
    </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
  noCitiesContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  noCitiesText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noCitiesSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
