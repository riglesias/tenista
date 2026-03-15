'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Building2, Globe, Lock, MapPin } from 'lucide-react-native';
import BottomSheet from './BottomSheet';

export interface Court {
  id: string;
  name: string;
  city_id: string;
  is_public: boolean | null;
  address?: string | null;
  surface_type?: string | null;
  number_of_courts?: number | null;
}

interface CourtOrg {
  court_id: string;
  org_name: string;
}

interface CourtSelectionSheetProps {
  isVisible: boolean;
  courts: Court[];
  selectedCourt: Court | null;
  onSelectCourt: (court: Court) => void;
  onClose: () => void;
  cityName?: string;
  courtOrgs?: CourtOrg[];
}

export default function CourtSelectionSheet({
  isVisible,
  courts,
  selectedCourt,
  onSelectCourt,
  onClose,
  cityName,
  courtOrgs = [],
}: CourtSelectionSheetProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [searchQuery, setSearchQuery] = useState('');

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    courtOrgs.forEach(co => map.set(co.court_id, co.org_name));
    return map;
  }, [courtOrgs]);

  const filteredCourts = useMemo(() => {
    if (searchQuery.trim() === '') return courts;
    const q = searchQuery.toLowerCase();
    return courts.filter(court =>
      court.name.toLowerCase().includes(q) ||
      (court.address && court.address.toLowerCase().includes(q))
    );
  }, [searchQuery, courts]);

  const handleSelectCourt = (court: Court) => {
    onSelectCourt(court);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const isSelected = (court: Court) => selectedCourt?.id === court.id;

  const formatSurface = (surface: string | null | undefined) => {
    if (!surface) return null;
    return surface.charAt(0).toUpperCase() + surface.slice(1);
  };

  const renderCourtCard = (court: Court) => {
    const selected = isSelected(court);
    const hasClub = orgMap.has(court.id);

    return (
      <TouchableOpacity
        key={court.id}
        onPress={() => handleSelectCourt(court)}
        style={{
          backgroundColor: selected ? (isDark ? 'rgba(132, 254, 12, 0.08)' : 'rgba(59, 130, 246, 0.06)') : colors.card,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.primary : colors.border,
        }}
        activeOpacity={0.7}
      >
        {/* Row 1: Name + checkmark */}
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

        {/* Row 2: Address */}
        {court.address && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
            <MapPin size={12} color={colors.mutedForeground} />
            <Text
              style={{ fontSize: 13, color: colors.mutedForeground, flex: 1 }}
              numberOfLines={1}
            >
              {court.address}
            </Text>
          </View>
        )}

        {/* Row 3: Badges */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
          {/* Public/Private badge */}
          {court.is_public !== null && (
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
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: court.is_public ? colors.success : colors.warning,
                }}
              >
                {court.is_public ? 'Public' : 'Private'}
              </Text>
            </View>
          )}

          {/* Club badge */}
          {hasClub && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                gap: 4,
              }}
            >
              <Building2 size={11} color={colors.warning} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.warning }}>
                {orgMap.get(court.id)}
              </Text>
            </View>
          )}

          {/* Surface type badge */}
          {court.surface_type && (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(107, 114, 128, 0.12)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: colors.mutedForeground }}>
                {formatSurface(court.surface_type)}
              </Text>
            </View>
          )}

          {/* Court count */}
          {court.number_of_courts && court.number_of_courts > 0 && (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(107, 114, 128, 0.12)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: colors.mutedForeground }}>
                {court.number_of_courts} {court.number_of_courts === 1 ? 'court' : 'courts'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMetaOption = (id: string, label: string, subtitle: string) => {
    const selected = selectedCourt?.id === id;
    const metaCourt: Court = {
      id,
      name: label,
      city_id: courts.length > 0 ? courts[0].city_id : '',
      is_public: null,
    };

    return (
      <TouchableOpacity
        key={id}
        onPress={() => handleSelectCourt(metaCourt)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          paddingHorizontal: 4,
        }}
        activeOpacity={0.7}
      >
        <View>
          <Text style={{
            fontSize: 15,
            fontWeight: selected ? '600' : '400',
            color: selected ? colors.primary : colors.mutedForeground,
          }}>
            {label}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
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
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      visible={isVisible}
      onClose={handleClose}
      snapPoints={[0.9]}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Select Homecourt or Club
        </Text>
        {cityName && (
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            in {cityName}
          </Text>
        )}

        {/* Search Bar */}
        <View
          style={{
            backgroundColor: colors.muted,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 16,
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.mutedForeground}
            style={{ marginRight: 12 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search courts..."
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              fontSize: 16,
              color: colors.foreground,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Courts List */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {filteredCourts.length === 0 && searchQuery.trim() !== '' ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: 'center' }}>
                No courts found
              </Text>
            </View>
          ) : (
            <>
              {/* Court cards */}
              {filteredCourts.map(court => renderCourtCard(court))}

              {/* Divider + meta options */}
              {searchQuery.trim() === '' && (
                <>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                    marginBottom: 4,
                    paddingHorizontal: 4,
                  }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginHorizontal: 12 }}>
                      Other options
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  </View>
                  {renderMetaOption('other', 'Other', 'For courts not listed above')}
                  {renderMetaOption('none', 'None', 'No preferred homecourt')}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
