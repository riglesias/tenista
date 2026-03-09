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
import { Building2 } from 'lucide-react-native';
import BottomSheet from './BottomSheet';

interface Court {
  id: string;
  name: string;
  city_id: string;
  is_public: boolean | null;
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
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([]);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    courtOrgs.forEach(co => map.set(co.court_id, co.org_name));
    return map;
  }, [courtOrgs]);

  // Create "None" and "Other" court options
  const noneCourt: Court = {
    id: 'none',
    name: 'None',
    city_id: courts.length > 0 ? courts[0].city_id : '',
    is_public: null,
  };

  const otherCourt: Court = {
    id: 'other',
    name: 'Other',
    city_id: courts.length > 0 ? courts[0].city_id : '',
    is_public: null,
  };

  useEffect(() => {
    // Always include "None" and "Other" options at the beginning
    const courtsWithOptions = [noneCourt, otherCourt, ...courts];
    
    if (searchQuery.trim() === '') {
      setFilteredCourts(courtsWithOptions);
    } else {
      const filtered = courtsWithOptions.filter(court =>
        court.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourts(filtered);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            marginBottom: 20,
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
        >
          {filteredCourts.length === 0 ? (
            <View
              style={{
                paddingVertical: 40,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                }}
              >
                No courts found
              </Text>
            </View>
          ) : (
            filteredCourts.map((court, index) => (
              <TouchableOpacity
                key={court.id}
                onPress={() => handleSelectCourt(court)}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: index === filteredCourts.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: selectedCourt?.id === court.id ? colors.primary : colors.foreground,
                      fontWeight: selectedCourt?.id === court.id ? '600' : '400',
                      marginBottom: (court.id === 'other' || court.id === 'none') ? 0 : 4,
                    }}
                  >
                    {court.name}
                  </Text>
                  {court.id !== 'other' && court.id !== 'none' && court.is_public !== null && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <View
                        style={{
                          backgroundColor: court.is_public ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: court.is_public ? 'rgb(34, 197, 94)' : 'rgb(245, 158, 11)',
                          }}
                        >
                          {court.is_public ? 'Public' : 'Private'}
                        </Text>
                      </View>
                      {orgMap.has(court.id) && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            gap: 4,
                          }}
                        >
                          <Building2 size={11} color="rgb(245, 158, 11)" />
                          <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgb(245, 158, 11)' }}>
                            {orgMap.get(court.id)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  {court.id === 'none' && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.mutedForeground,
                        marginTop: 2,
                      }}
                    >
                      No preferred homecourt
                    </Text>
                  )}
                  {court.id === 'other' && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.mutedForeground,
                        marginTop: 2,
                      }}
                    >
                      For courts not listed above
                    </Text>
                  )}
                </View>
                {selectedCourt?.id === court.id && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
} 