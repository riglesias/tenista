'use client'

import { OnboardingButtons, OnboardingLayout, createOnboardingStyles } from '@/components/onboarding';
import CourtSelectionSheet from '@/components/ui/CourtSelectionSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getCourtsByCity } from '@/lib/actions/courts.actions';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { getOrganizationByCourtId, joinClub } from '@/lib/actions/organizations.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Building2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

type Court = {
  id: string;
  name: string;
  city_id: string;
  is_public: boolean | null;
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

export default function HomecourtOnboarding() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const onboardingStyles = createOnboardingStyles(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('onboarding');
  const { t: tProfile } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtOrgs, setCourtOrgs] = useState<CourtOrg[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [showCourtSheet, setShowCourtSheet] = useState(false);
  const [cityName, setCityName] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Club verification state
  const [pendingOrg, setPendingOrg] = useState<LinkedOrg | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [clubVerified, setClubVerified] = useState(false);
  const [verifiedClubName, setVerifiedClubName] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await getPlayerProfile(user.id);

      if (profile) {
        setCityName(profile.city_name);
        setPlayerId(profile.id);

        if (profile.city_id) {
          const { data: courtsData } = await getCourtsByCity(profile.city_id);
          if (courtsData) {
            setCourts(courtsData);
          }

          // Fetch organizations linked to courts
          const { data: orgs } = await supabase
            .from('organizations')
            .select('court_id, name')
            .not('court_id', 'is', null);
          if (orgs) {
            setCourtOrgs(orgs.map((o: any) => ({ court_id: o.court_id, org_name: o.name })));
          }
        }

        // If user already has a homecourt, pre-select it
        if (profile.homecourt_id && profile.city_id) {
          const { data: courtsData } = await getCourtsByCity(profile.city_id);
          if (courtsData) {
            const userCourt = courtsData.find(court => court.id === profile.homecourt_id);
            if (userCourt) {
              setSelectedCourt(userCourt);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading homecourt data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourtSelect = async (court: Court) => {
    setPendingOrg(null);
    setJoinCode('');
    setClubVerified(false);
    setVerifiedClubName(null);

    if (court.id === 'other' || court.id === 'none') {
      setSelectedCourt(court);
      return;
    }

    // Check if the selected court has a linked organization
    const { data: linkedOrg } = await getOrganizationByCourtId(court.id);

    if (linkedOrg) {
      // Private club court — need verification
      setPendingOrg(linkedOrg);
      setSelectedCourt(court);
    } else {
      // Public court with no linked org
      setSelectedCourt(court);
    }
  };

  const handleVerifyAndJoin = async () => {
    if (!playerId || !pendingOrg || !joinCode.trim()) return;

    setVerifying(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const { data, error, errorType } = await joinClub(playerId, code, selectedCourt?.id);

      if (error) {
        if (errorType === 'invalid_code') {
          Alert.alert(tErrors('generic.somethingWentWrong'), tProfile('editClub.invalidCode'));
        } else {
          Alert.alert(tErrors('generic.somethingWentWrong'), tProfile('editClub.joinError'));
        }
        return;
      }

      if (data) {
        setVerifiedClubName(data.organization_name);
        setClubVerified(true);
        setPendingOrg(null);
        setJoinCode('');
      }
    } catch (error) {
      console.error('Error verifying club code:', error);
      Alert.alert(tErrors('generic.somethingWentWrong'), tProfile('editClub.joinError'));
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = async () => {
    if (!user) return;

    // If there's a pending org that needs verification, block
    if (pendingOrg) {
      Alert.alert(t('homecourt.title'), tProfile('editHomecourt.verifyFirst'));
      return;
    }

    setSaving(true);
    try {
      const homecourtId = selectedCourt && selectedCourt.id !== 'other' && selectedCourt.id !== 'none'
        ? selectedCourt.id
        : null;

      // Only save homecourt if not already saved by joinClub
      if (!clubVerified) {
        const { error } = await createOrUpdatePlayerProfile(user.id, {
          homecourt_id: homecourtId,
        });

        if (error) {
          Alert.alert(tErrors('generic.somethingWentWrong'), t('location.saveError'));
          console.error('Homecourt save error:', error);
          return;
        }
      }

      router.push('/onboarding/contact' as any);
    } catch (error) {
      Alert.alert(tErrors('generic.somethingWentWrong'), tErrors('generic.tryAgain'));
      console.error('Homecourt save exception:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/contact' as any);
  };

  const handleBack = () => {
    router.back();
  };

  const selectedCourtData = selectedCourt;

  if (loading) {
    return (
      <OnboardingLayout
        title={t('homecourt.title')}
        subtitle={t('homecourt.subtitle')}
        scrollable={false}
      >
        <View style={onboardingStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={onboardingStyles.loadingText}>{tProfile('editHomecourt.loading')}</Text>
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
        title={t('homecourt.title')}
        subtitle={t('homecourt.subtitle')}
        buttons={
          <OnboardingButtons
            onContinue={handleContinue}
            onSkip={handleSkip}
            loading={saving}
            continueDisabled={!!pendingOrg}
            hideBack
          />
        }
      >
        {/* City (read-only context) */}
        {cityName && (
          <View style={styles.sectionContainer}>
            <View style={[styles.cityBadge, { backgroundColor: colors.muted }]}>
              <Ionicons name="location" size={16} color={colors.mutedForeground} />
              <Text style={[styles.cityText, { color: colors.mutedForeground }]}>
                {cityName}
              </Text>
            </View>
          </View>
        )}

        {/* Court Selector */}
        <View style={styles.sectionContainer}>
          <Text style={onboardingStyles.sectionTitle}>{t('location.homecourt')}</Text>

          {courts.length === 0 ? (
            <View style={[styles.noCourtsContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="tennisball-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.noCourtsText, { color: colors.foreground }]}>
                {t('location.noCourts')}
              </Text>
              <Text style={[styles.noCourtsSubtext, { color: colors.mutedForeground }]}>
                {t('location.addingCourts')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.selectorButton,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setShowCourtSheet(true)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.selectorText,
                  { color: selectedCourtData ? colors.foreground : colors.mutedForeground }
                ]}>
                  {selectedCourtData ? selectedCourtData.name : t('location.selectHomecourt')}
                </Text>
                {selectedCourtData && selectedCourtData.id !== 'other' && selectedCourtData.id !== 'none' && selectedCourtData.is_public !== null && (
                  <Text style={[styles.courtSubtext, { color: colors.mutedForeground }]}>
                    {selectedCourtData.is_public ? t('location.public') : t('location.private')}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Club Verification Section */}
        {pendingOrg && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.verificationCard,
                {
                  backgroundColor: colors.card,
                  borderColor: 'rgb(245, 158, 11)',
                }
              ]}
            >
              <View style={styles.orgHeader}>
                {pendingOrg.image_url ? (
                  <Image
                    source={{ uri: pendingOrg.image_url }}
                    style={styles.orgImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.orgImagePlaceholder, { backgroundColor: colors.muted }]}>
                    <Building2 size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orgName, { color: colors.foreground }]}>
                    {pendingOrg.name}
                  </Text>
                  <Text style={[styles.orgPrompt, { color: colors.mutedForeground }]}>
                    {tProfile('editHomecourt.privateClubPrompt')}
                  </Text>
                </View>
              </View>

              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder={tProfile('editClub.codePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={30}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }
                ]}
              />

              <TouchableOpacity
                onPress={handleVerifyAndJoin}
                disabled={!joinCode.trim() || verifying}
                style={[
                  styles.verifyButton,
                  {
                    backgroundColor: joinCode.trim() ? colors.primary : colors.muted,
                  }
                ]}
                activeOpacity={0.7}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.verifyButtonText,
                      {
                        color: joinCode.trim() ? colors.primaryForeground : colors.mutedForeground,
                      }
                    ]}
                  >
                    {tProfile('editHomecourt.verifyAndJoin')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Club Verified Badge */}
        {clubVerified && selectedCourtData && (
          <View style={styles.sectionContainer}>
            <View style={[styles.verifiedBadge, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <Building2 size={16} color={colors.primary} />
              <Text style={[styles.verifiedText, { color: colors.primary }]}>
                {tProfile('editClub.joinSuccess', { name: verifiedClubName || '' })}
              </Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>
          </View>
        )}

        {/* Court Selection Sheet */}
        <CourtSelectionSheet
          isVisible={showCourtSheet}
          courts={courts}
          selectedCourt={selectedCourt}
          onSelectCourt={handleCourtSelect}
          onClose={() => setShowCourtSheet(false)}
          cityName={cityName || undefined}
          courtOrgs={courtOrgs}
        />
      </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  cityText: {
    fontSize: 14,
    fontWeight: '500',
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
  courtSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  noCourtsContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  noCourtsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noCourtsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  verificationCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orgImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  orgImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '600',
  },
  orgPrompt: {
    fontSize: 13,
    marginTop: 2,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  verifyButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
