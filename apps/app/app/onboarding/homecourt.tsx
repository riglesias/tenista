'use client'

import { OnboardingButtons, OnboardingLayout, createOnboardingStyles } from '@/components/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getCourtsByCity } from '@/lib/actions/courts.actions';
import { createOrUpdatePlayerProfile, getPlayerProfile } from '@/lib/actions/player.actions';
import { getOrganizationByCourtId, joinClub } from '@/lib/actions/organizations.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Building2, Globe, Lock, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppToast } from '@/components/ui/Toast';
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

const SEARCH_THRESHOLD = 5;

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
  const { showToast } = useAppToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtOrgs, setCourtOrgs] = useState<CourtOrg[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityName, setCityName] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Club verification state
  const [pendingOrg, setPendingOrg] = useState<LinkedOrg | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [clubVerified, setClubVerified] = useState(false);
  const [verifiedClubName, setVerifiedClubName] = useState<string | null>(null);


  const filteredCourts = useMemo(() => {
    if (searchQuery.trim() === '') return courts;
    const q = searchQuery.toLowerCase();
    return courts.filter(court =>
      court.name.toLowerCase().includes(q) ||
      (court.address && court.address.toLowerCase().includes(q))
    );
  }, [searchQuery, courts]);

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
          const [courtsResult, orgsResult] = await Promise.all([
            getCourtsByCity(profile.city_id),
            supabase
              .from('organizations')
              .select('court_id, name')
              .not('court_id', 'is', null),
          ]);

          if (courtsResult.data) {
            setCourts(courtsResult.data);

            if (profile.homecourt_id) {
              const userCourt = courtsResult.data.find((court: Court) => court.id === profile.homecourt_id);
              if (userCourt) {
                setSelectedCourt(userCourt);
              }
            }
          }

          if (orgsResult.data) {
            setCourtOrgs(orgsResult.data.map((o: any) => ({ court_id: o.court_id, org_name: o.name })));
          }
        }
      }
    } catch (error) {
      // silently handled
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

    const { data: linkedOrg } = await getOrganizationByCourtId(court.id);

    if (linkedOrg) {
      setPendingOrg(linkedOrg);
      setSelectedCourt(court);
    } else {
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
          showToast(tProfile('editClub.invalidCode'), { type: 'error' });
        } else {
          showToast(tProfile('editClub.joinError'), { type: 'error' });
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
      showToast(tProfile('editClub.joinError'), { type: 'error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = async () => {
    if (!user) return;

    if (pendingOrg) {
      showToast(tProfile('editHomecourt.verifyFirst'), { type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const homecourtId = selectedCourt && selectedCourt.id !== 'other' && selectedCourt.id !== 'none'
        ? selectedCourt.id
        : null;

      if (!clubVerified) {
        const { error } = await createOrUpdatePlayerProfile(user.id, {
          homecourt_id: homecourtId,
        });

        if (error) {
          showToast(t('location.saveError'), { type: 'error' });
          return;
        }
      }

      router.push('/onboarding/contact' as any);
    } catch (error) {
      showToast(tErrors('generic.tryAgain'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };


  const handleBack = () => {
    router.back();
  };


  const isSelected = (court: Court) => selectedCourt?.id === court.id;

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
      {/* Back Button */}
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
            loading={saving}
            continueDisabled={!!pendingOrg}
            hideBack
          />
        }
      >
        {/* City badge removed — context already clear from previous onboarding step */}

        {courts.length === 0 ? (
          /* No courts available */
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
          <>
            {/* Search bar (only when enough courts) */}
            {courts.length > SEARCH_THRESHOLD && (
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.mutedForeground}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('location.searchCourts') || 'Search courts...'}
                  placeholderTextColor={colors.mutedForeground}
                  style={{ flex: 1, fontSize: 15, color: colors.foreground }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Inline court cards */}
            {filteredCourts.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: colors.mutedForeground }}>
                  No courts found
                </Text>
              </View>
            ) : (
              filteredCourts.map(court => {
                const selected = isSelected(court);
                return (
                  <TouchableOpacity
                    key={court.id}
                    onPress={() => handleCourtSelect(court)}
                    style={{
                      backgroundColor: selected
                        ? (isDark ? 'rgba(132, 254, 12, 0.08)' : 'rgba(59, 130, 246, 0.06)')
                        : colors.card,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 8,
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Name + checkmark */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: selected ? colors.primary : colors.foreground,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {court.name}
                      </Text>
                      {selected && (
                        <View style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 8,
                        }}>
                          <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
                        </View>
                      )}
                    </View>

                    {/* Public/Private badge */}
                    {court.is_public !== null && (
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: court.is_public ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            gap: 4,
                          }}
                        >
                          {court.is_public
                            ? <Globe size={11} color={colors.success} />
                            : <Lock size={11} color={colors.warning} />
                          }
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: court.is_public ? colors.success : colors.warning,
                          }}>
                            {court.is_public ? 'Public' : 'Private'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {/* Other / None options */}
            {searchQuery.trim() === '' && (
              <>
                {([
                  { id: 'other', label: 'Other', subtitle: 'My court is not listed' },
                  { id: 'none', label: 'None', subtitle: 'No preferred homecourt' },
                ] as const).map(({ id, label, subtitle }) => {
                  const selected = selectedCourt?.id === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => handleCourtSelect({
                        id,
                        name: label,
                        city_id: courts.length > 0 ? courts[0].city_id : '',
                        is_public: null,
                      })}
                      style={{
                        backgroundColor: selected
                          ? (isDark ? 'rgba(132, 254, 12, 0.08)' : 'rgba(59, 130, 246, 0.06)')
                          : colors.card,
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 8,
                        borderWidth: selected ? 1.5 : 1,
                        borderColor: selected ? colors.primary : colors.border,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: selected ? colors.primary : colors.foreground,
                          }}>
                            {label}
                          </Text>
                          <Text style={{
                            fontSize: 13,
                            color: colors.mutedForeground,
                            marginTop: 2,
                          }}>
                            {subtitle}
                          </Text>
                        </View>
                        {selected && (
                          <View style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}

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
        {clubVerified && selectedCourt && (
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
      </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
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
