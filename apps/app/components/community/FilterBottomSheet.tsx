'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { RangeSlider } from './RangeSlider';

const { height: screenHeight } = Dimensions.get('window');

interface FilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  ratingRange: [number, number];
  onRatingRangeChange: (range: [number, number]) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export default function FilterBottomSheet({
  isVisible,
  onClose,
  ratingRange,
  onRatingRangeChange,
  onApplyFilters,
  onClearFilters
}: FilterBottomSheetProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation('community');
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const formatRating = (rating: number): string => {
    if (rating >= 5) return '5.0+';
    if (rating === 0) return '0.0';
    return rating.toFixed(1);
  };



  const handleBackdropPress = () => {
    onClose();
  };

  const handleApplyFilters = () => {
    onApplyFilters();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
          
          {/* Bottom Sheet */}
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: 34,
              transform: [{ translateY }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  backgroundColor: colors.mutedForeground,
                  borderRadius: 2,
                  opacity: 0.3,
                }}
              />
            </View>

            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 16,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: colors.foreground,
              }}>
                {t('filters.title')}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ paddingHorizontal: 24 }}>
              {/* Rating Filter */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.foreground,
                  marginBottom: 8,
                }}>
                  {t('filters.ratingRange')}
                </Text>

                <RangeSlider
                  min={1}
                  max={5}
                  step={0.5}
                  values={ratingRange}
                  onValuesChange={onRatingRangeChange}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 24,
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: colors.secondary,
                  alignItems: 'center',
                }}
                onPress={onClearFilters}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.secondaryForeground,
                }}>
                  {t('filters.clear')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
                onPress={handleApplyFilters}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.primaryForeground,
                }}>
                  {t('filters.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
} 