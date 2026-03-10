'use client'

import BottomButtons from '@/components/ui/BottomButtons';
import SelectionBottomSheet, { SelectionOption } from '@/components/ui/SelectionBottomSheet';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAppToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllCities } from '@/lib/actions/cities.actions';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type City = {
  id: string;
  name: string;
  state_province: string | null;
  country_code: string;
  country_name: string;
};

type Country = {
  code: string;
  name: string;
  cities: City[];
};

export default function EditLocation() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { showToast } = useAppToast();
  const { t } = useTranslation('profile');
  const { t: tErrors } = useTranslation('errors');
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(null);
  const [selectedCity, setSelectedCity] = React.useState<string | null>(null);
  const [showCountrySheet, setShowCountrySheet] = React.useState(false);
  const [showCitySheet, setShowCitySheet] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<{
    country_code: string | null;
    city_id: string | null;
  }>({ country_code: null, city_id: null });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load current profile and available cities in parallel
      const [profileResult, citiesResult] = await Promise.all([
        getPlayerProfile(user.id),
        getAllCities()
      ]);

      // Set current location from profile
      if (profileResult.data) {
        const profile = profileResult.data;
        setCurrentLocation({
          country_code: profile.country_code,
          city_id: profile.city_id,
        });
        setSelectedCountry(profile.country_code);
        setSelectedCity(profile.city_id);
      }

      // Group cities by country
      if (citiesResult.data) {
        const countryMap = new Map<string, Country>();
        
        citiesResult.data.forEach((city: City) => {
          if (!countryMap.has(city.country_code)) {
            countryMap.set(city.country_code, {
              code: city.country_code,
              name: city.country_name,
              cities: []
            });
          }
          countryMap.get(city.country_code)!.cities.push(city);
        });

        // Sort countries by name and cities by name
        const sortedCountries = Array.from(countryMap.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(country => ({
            ...country,
            cities: country.cities.sort((a, b) => a.name.localeCompare(b.name))
          }));

        setCountries(sortedCountries);
      }
    } catch (error) {
      showToast(t('editLocation.loadError'), { type: 'error' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedCity(null); // Reset city selection when country changes
  };

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!selectedCountry || !selectedCity) {
      showToast(t('editLocation.selectCountryAndCity'), { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Find the selected city data
      const selectedCityData = countries
        .find(c => c.code === selectedCountry)
        ?.cities.find(city => city.id === selectedCity);

      if (!selectedCityData) {
        showToast(t('editLocation.invalidSelection'), { type: 'error' });
        setLoading(false);
        return;
      }

      const { error } = await createOrUpdatePlayerProfile(user.id, {
        city_id: selectedCityData.id,
        city_name: selectedCityData.name,
        state_province: selectedCityData.state_province,
        // Note: country_code and country_name are automatically set by database trigger when city_id changes
      });

      if (error) {
        showToast(t('editLocation.saveError'), { type: 'error' });
      } else {
        // Reload profile to get updated country data from database trigger
        const { data: updatedProfile } = await getPlayerProfile(user.id);
        if (updatedProfile) {
          setCurrentLocation({
            country_code: updatedProfile.country_code,
            city_id: updatedProfile.city_id,
          });
          setSelectedCountry(updatedProfile.country_code);
          setSelectedCity(updatedProfile.city_id);
        }

        showToast(t('editLocation.saveSuccess'), { type: 'success' });
        // Auto-navigate back after a short delay
        setTimeout(() => router.back(), 1000);
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

  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const selectedCityData = selectedCountryData?.cities.find(c => c.id === selectedCity);
  const hasChanges = selectedCountry !== currentLocation.country_code ||
                     selectedCity !== currentLocation.city_id;

  // Create selection options for countries
  const countryOptions: SelectionOption[] = countries.map(country => ({
    label: country.name,
    value: country.code
  }));

  // Create selection options for cities
  const cityOptions: SelectionOption[] = selectedCountryData?.cities.map(city => ({
    label: `${city.name}${city.state_province ? `, ${city.state_province}` : ''}`,
    value: city.id
  })) || [];

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('editLocation.title')}
          onBack={handleCancel}
        />
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className={`text-base mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('editLocation.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('editLocation.title')}
        onBack={handleCancel}
      />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className={`text-base mb-8 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('editLocation.subtitle')}
        </Text>

        {/* Country Selection */}
        <View className="mb-6">
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            {t('editLocation.country')}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => setShowCountrySheet(true)}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: selectedCountryData ? colors.foreground : colors.mutedForeground,
                flex: 1,
              }}
            >
              {selectedCountryData ? selectedCountryData.name : t('editLocation.selectCountry')}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* City Selection */}
        {selectedCountryData && (
          <View className="mb-6">
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12,
              }}
            >
              {t('editLocation.city')}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onPress={() => setShowCitySheet(true)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: selectedCityData ? colors.foreground : colors.mutedForeground,
                  flex: 1,
                }}
              >
                {selectedCityData
                  ? `${selectedCityData.name}${selectedCityData.state_province ? `, ${selectedCityData.state_province}` : ''}`
                  : t('editLocation.selectCity')
                }
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Country Selection Sheet */}
      <SelectionBottomSheet
        visible={showCountrySheet}
        onClose={() => setShowCountrySheet(false)}
        title={t('editLocation.selectCountryTitle')}
        options={countryOptions}
        selectedValue={selectedCountry}
        onSelect={handleCountrySelect}
        searchable={true}
        placeholder={t('editLocation.searchCountries')}
        emptyText={t('editLocation.noCountriesFound')}
      />

      {/* City Selection Sheet */}
      <SelectionBottomSheet
        visible={showCitySheet}
        onClose={() => setShowCitySheet(false)}
        title={t('editLocation.selectCityTitle')}
        options={cityOptions}
        selectedValue={selectedCity}
        onSelect={handleCitySelect}
        searchable={true}
        placeholder={t('editLocation.searchCities')}
        emptyText={t('editLocation.noCitiesFound')}
      />

      <BottomButtons
        onCancel={handleCancel}
        onSave={handleSave}
        loading={loading}
        disabled={!hasChanges || !selectedCountry || !selectedCity}
        saveText={t('edit.save')}
      />
    </SafeAreaView>
  );
} 