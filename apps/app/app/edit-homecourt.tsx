'use client'

import BottomButtons from '@/components/ui/BottomButtons';
import CourtSelectionSheet from '@/components/ui/CourtSelectionSheet';
import SelectionBottomSheet, { SelectionOption } from '@/components/ui/SelectionBottomSheet';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAppToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllCities } from '@/lib/actions/cities.actions';
import { getCourtsByCity } from '@/lib/actions/courts.actions';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { getPlayerClub, getOrganizationByCourtId, joinClub, leaveClub } from '@/lib/actions/organizations.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Building2 } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PlayerOrganization } from '@/lib/validation/organization.validation';
import { supabase } from '@/lib/supabase';

type Court = {
  id: string;
  name: string;
  city_id: string;
  is_public: boolean | null;
  address?: string | null;
  surface_type?: string | null;
  number_of_courts?: number | null;
};

type CourtOrg = {
  court_id: string;
  org_name: string;
};

type LinkedOrg = {
  id: string;
  name: string;
  join_code: string | null;
  image_url: string | null;
};

type CityItem = {
  id: string;
  name: string;
  state_province: string | null;
  country_code: string;
  country_name: string;
};

export default function EditHomecourt() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { showToast } = useAppToast();
  const { confirm } = useConfirmDialog();
  const { t } = useTranslation('profile');
  const { t: tErrors } = useTranslation('errors');
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [courts, setCourts] = React.useState<Court[]>([]);
  const [courtOrgs, setCourtOrgs] = React.useState<CourtOrg[]>([]);
  const [selectedCourt, setSelectedCourt] = React.useState<string | null>(null);
  const [showCourtSheet, setShowCourtSheet] = React.useState(false);
  const [cityName, setCityName] = React.useState<string | null>(null);
  const [cityId, setCityId] = React.useState<string | null>(null);
  const [currentHomecourtId, setCurrentHomecourtId] = React.useState<string | null>(null);
  const [playerId, setPlayerId] = React.useState<string | null>(null);
  const [currentClub, setCurrentClub] = React.useState<PlayerOrganization | null>(null);
  // City selection state
  const [allCities, setAllCities] = React.useState<CityItem[]>([]);
  const [showCitySheet, setShowCitySheet] = React.useState(false);
  const [originalCityId, setOriginalCityId] = React.useState<string | null>(null);
  // Club verification state for private court selection
  const [pendingOrg, setPendingOrg] = React.useState<LinkedOrg | null>(null);
  const [joinCode, setJoinCode] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await getPlayerProfile(user.id);

      if (error) {
        showToast(t('editHomecourt.loadError'), { type: 'error' });
        return;
      }

      if (profile) {
        setCityName(profile.city_name);
        setCityId(profile.city_id);
        setOriginalCityId(profile.city_id);
        setSelectedCourt(profile.homecourt_id);
        setCurrentHomecourtId(profile.homecourt_id);
        setPlayerId(profile.id);

        // Load courts, club, and cities in parallel
        const promises: Promise<any>[] = [getPlayerClub(profile.id), getAllCities()];
        if (profile.city_id) {
          promises.push(getCourtsByCity(profile.city_id));
        }

        const results = await Promise.all(promises);
        const clubResult = results[0];
        setCurrentClub(clubResult.data);

        // Store all cities
        if (results[1]?.data) {
          setAllCities(results[1].data);
        }

        if (profile.city_id && results[2]?.data) {
          setCourts(results[2].data);

          // Fetch organizations linked to courts
          const { data: orgs } = await supabase
            .from('organizations')
            .select('court_id, name')
            .not('court_id', 'is', null);
          if (orgs) {
            setCourtOrgs(orgs.map((o: any) => ({ court_id: o.court_id, org_name: o.name })));
          }
        }
      }
    } catch (error) {
      showToast(t('editHomecourt.loadError'), { type: 'error' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCourtSelect = async (court: Court) => {
    // Reset pending verification
    setPendingOrg(null);
    setJoinCode('');

    if (court.id === 'other' || court.id === 'none') {
      // If player was in a club, warn about leaving
      if (currentClub) {
        confirm({
          title: t('editHomecourt.leaveClubTitle'),
          message: t('editHomecourt.leaveClubMessage', { name: currentClub.organization_name }),
          cancelText: t('editHomecourt.cancel'),
          confirmText: t('editHomecourt.continue'),
          destructive: false,
          onConfirm: () => setSelectedCourt(court.id),
        });
        return;
      }
      setSelectedCourt(court.id);
      return;
    }

    // Check if the selected court has a linked organization
    const { data: linkedOrg } = await getOrganizationByCourtId(court.id);

    if (linkedOrg) {
      // Check if player is already a member of this club
      if (currentClub && currentClub.organization_id === linkedOrg.id) {
        // Already a member — just set the court
        setSelectedCourt(court.id);
        return;
      }

      // If switching from another club, warn first
      if (currentClub && currentClub.organization_id !== linkedOrg.id) {
        confirm({
          title: t('editHomecourt.switchClubTitle'),
          message: t('editHomecourt.switchClubMessage', { oldClub: currentClub.organization_name, newClub: linkedOrg.name }),
          cancelText: t('editHomecourt.cancel'),
          confirmText: t('editHomecourt.continue'),
          destructive: false,
          onConfirm: () => {
            setPendingOrg(linkedOrg);
            setSelectedCourt(court.id);
          },
        });
        return;
      }

      // Not in any club — need verification
      setPendingOrg(linkedOrg);
      setSelectedCourt(court.id);
    } else {
      // Public court with no linked org
      if (currentClub) {
        confirm({
          title: t('editHomecourt.leaveClubTitle'),
          message: t('editHomecourt.leaveClubMessage', { name: currentClub.organization_name }),
          cancelText: t('editHomecourt.cancel'),
          confirmText: t('editHomecourt.continue'),
          destructive: false,
          onConfirm: () => setSelectedCourt(court.id),
        });
        return;
      }
      setSelectedCourt(court.id);
    }
  };

  const handleCitySelect = async (newCityId: string) => {
    const city = allCities.find(c => c.id === newCityId);
    if (!city || newCityId === cityId) return;

    setCityId(newCityId);
    setCityName(city.name);
    // Reset court selection since courts are city-specific
    setSelectedCourt(null);
    setPendingOrg(null);
    setJoinCode('');
    setCourts([]);
    setCourtOrgs([]);

    // Reload courts for the new city
    try {
      const [courtsResult, orgsResult] = await Promise.all([
        getCourtsByCity(newCityId),
        supabase
          .from('organizations')
          .select('court_id, name')
          .not('court_id', 'is', null),
      ]);
      if (courtsResult.data) {
        setCourts(courtsResult.data);
      }
      if (orgsResult.data) {
        setCourtOrgs(orgsResult.data.map((o: any) => ({ court_id: o.court_id, org_name: o.name })));
      }
    } catch (error) {
      // silently handled
    }
  };

  const handleVerifyAndJoin = async () => {
    if (!playerId || !pendingOrg || !joinCode.trim()) return;

    setVerifying(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const { data, error, errorType } = await joinClub(playerId, code, selectedCourt);

      if (error) {
        if (errorType === 'invalid_code') {
          showToast(t('editClub.invalidCode'), { type: 'error' });
        } else {
          showToast(t('editClub.joinError'), { type: 'error' });
        }
        return;
      }

      if (data) {
        setCurrentClub(data);
        setPendingOrg(null);
        setJoinCode('');
        setCurrentHomecourtId(selectedCourt);
        showToast(t('editHomecourt.joinedClubSuccess', { name: data.organization_name }), { type: 'success' });
        setTimeout(() => router.back(), 1000);
      }
    } catch (error) {
      showToast(t('editClub.joinError'), { type: 'error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // If there's a pending org that needs verification, don't save
    if (pendingOrg) {
      showToast(t('editHomecourt.verifyFirst'), { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const homecourtId = selectedCourt && selectedCourt !== 'other' && selectedCourt !== 'none'
        ? selectedCourt
        : null;

      // If switching to public court and was in a club, leave club
      if (currentClub && (!homecourtId || homecourtId !== currentClub.court_id)) {
        if (playerId) {
          await leaveClub(playerId);
          setCurrentClub(null);
        }
      }

      const profileUpdate: Record<string, any> = {
        homecourt_id: homecourtId,
      };

      // Include city fields if city changed
      if (cityId !== originalCityId) {
        const city = allCities.find(c => c.id === cityId);
        if (city) {
          profileUpdate.city_id = city.id;
          profileUpdate.city_name = city.name;
          profileUpdate.state_province = city.state_province || null;
        }
      }

      const { error } = await createOrUpdatePlayerProfile(user.id, profileUpdate);

      if (error) {
        showToast(t('editHomecourt.saveError'), { type: 'error' });
      } else {
        setCurrentHomecourtId(selectedCourt);
        showToast(t('editHomecourt.saveSuccess'), { type: 'success' });
        setTimeout(() => router.back(), 1000);
      }
    } catch (error) {
      showToast(tErrors('generic.tryAgain'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClub = () => {
    if (!currentClub || !playerId) return;

    confirm({
      title: t('editClub.leaveConfirmTitle'),
      message: t('editHomecourt.leaveClubClearsHomecourt', { name: currentClub.organization_name }),
      cancelText: t('editHomecourt.cancel'),
      confirmText: t('editClub.leaveClub'),
      destructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const { error } = await leaveClub(playerId);
          if (error) {
            showToast(t('editClub.leaveError'), { type: 'error' });
            return;
          }
          const clubName = currentClub.organization_name;
          setCurrentClub(null);
          setSelectedCourt(null);
          setCurrentHomecourtId(null);
          showToast(t('editClub.leaveSuccess', { name: clubName }), { type: 'success' });
        } catch (error) {
          showToast(t('editClub.leaveError'), { type: 'error' });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  const selectedCourtData = selectedCourt === 'other'
    ? { id: 'other', name: 'Other', city_id: cityId || '', is_public: null }
    : selectedCourt === 'none'
    ? { id: 'none', name: 'None', city_id: cityId || '', is_public: null }
    : courts.find(c => c.id === selectedCourt);

  const hasChanges = selectedCourt !== currentHomecourtId || cityId !== originalCityId;

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('editHomecourt.title')}
          onBack={handleCancel}
        />
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className={`text-base mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('editHomecourt.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cityOptions: SelectionOption[] = allCities.map(c => ({
    label: c.name,
    value: c.id,
  }));

  if (!cityId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('editHomecourt.title')}
          onBack={handleCancel}
        />
        <View className="flex-1 justify-center items-center px-6">
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 50,
              padding: 20,
              marginBottom: 20
            }}
          >
            <Ionicons name="location-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedForeground,
              textAlign: 'center',
              paddingHorizontal: 32
            }}
          >
            {t('editHomecourt.noCitySet')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowCitySheet(true)}
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: '600', fontSize: 16 }}>
              {t('editLocation.title')}
            </Text>
          </TouchableOpacity>
        </View>
        <SelectionBottomSheet
          visible={showCitySheet}
          onClose={() => setShowCitySheet(false)}
          title={t('editLocation.selectCityTitle')}
          options={cityOptions}
          selectedValue={cityId}
          onSelect={handleCitySelect}
          searchable
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('editHomecourt.title')}
        onBack={handleCancel}
      />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className={`text-base mb-8 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('editHomecourt.subtitle')}
        </Text>

        {/* City Selection */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons
                name="location"
                size={20}
                color={colors.foreground}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.foreground,
                  flex: 1,
                }}
              >
                {cityName}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* Homecourt Selection */}
        <View className="mb-6">
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            {t('editHomecourt.selectHomecourt')}
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
            onPress={() => setShowCourtSheet(true)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: selectedCourtData ? colors.foreground : colors.mutedForeground,
                }}
              >
                {selectedCourtData ? selectedCourtData.name : t('editLocation.selectHomecourt')}
              </Text>
              {selectedCourtData && selectedCourtData.id !== 'other' && selectedCourtData.id !== 'none' && selectedCourtData.is_public !== null && (
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    marginTop: 4,
                  }}
                >
                  {selectedCourtData.is_public ? t('editLocation.public') : t('editLocation.private')}
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* Club Verification Section (when selecting a private club court) */}
        {pendingOrg && (
          <View className="mb-6">
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: 'rgb(245, 158, 11)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {pendingOrg.image_url ? (
                  <Image
                    source={{ uri: pendingOrg.image_url }}
                    style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: colors.muted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Building2 size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                    {pendingOrg.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
                    {t('editHomecourt.privateClubPrompt')}
                  </Text>
                </View>
              </View>

              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder={t('editClub.codePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={30}
                style={{
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 12,
                }}
              />

              <TouchableOpacity
                onPress={handleVerifyAndJoin}
                disabled={!joinCode.trim() || verifying}
                style={{
                  backgroundColor: joinCode.trim() ? colors.primary : colors.muted,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: joinCode.trim() ? colors.primaryForeground : colors.mutedForeground,
                    }}
                  >
                    {t('editHomecourt.verifyAndJoin')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Club Card */}
        {currentClub && !pendingOrg && (
          <View className="mb-6">
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12,
              }}
            >
              {t('editClub.currentClub')}
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Building2 size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: colors.foreground,
                      flex: 1,
                    }}
                  >
                    {currentClub.organization_name}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>

              {/* Leave Club Button */}
              <TouchableOpacity
                onPress={handleLeaveClub}
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: '#ef4444',
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>
                  {t('editClub.leaveClub')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Court Selection Sheet */}
      <CourtSelectionSheet
        isVisible={showCourtSheet}
        courts={courts}
        selectedCourt={selectedCourtData || null}
        onSelectCourt={handleCourtSelect}
        onClose={() => setShowCourtSheet(false)}
        cityName={cityName || undefined}
        courtOrgs={courtOrgs}
      />

      {/* City Selection Sheet */}
      <SelectionBottomSheet
        visible={showCitySheet}
        onClose={() => setShowCitySheet(false)}
        title={t('editLocation.selectCityTitle')}
        options={cityOptions}
        selectedValue={cityId}
        onSelect={handleCitySelect}
        searchable
      />

      {!pendingOrg && (
        <BottomButtons
          onCancel={handleCancel}
          onSave={handleSave}
          loading={loading}
          disabled={!hasChanges}
          saveText={t('edit.save')}
        />
      )}
    </SafeAreaView>
  );
}
