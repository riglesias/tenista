'use client'

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import { onboardingStyles } from './onboarding-styles';

interface SearchModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder?: string;
  data: T[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  renderItem: (item: T) => React.ReactElement;
  keyExtractor: (item: T) => string;
  emptyText?: string;
}

export function SearchModal<T>({
  visible,
  onClose,
  title,
  searchPlaceholder = 'Search',
  data,
  searchQuery,
  onSearchChange,
  renderItem,
  keyExtractor,
  emptyText = 'No results found',
}: SearchModalProps<T>) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Small delay to ensure modal is open before focusing
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    onSearchChange('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={onboardingStyles.modalContainer}>
        <View style={onboardingStyles.modalHeader}>
          <Text style={onboardingStyles.modalTitle}>{title}</Text>
          <TouchableOpacity 
            onPress={handleClose}
            style={onboardingStyles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={onboardingStyles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} style={onboardingStyles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={onboardingStyles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={data}
          renderItem={({ item }) => renderItem(item)}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={onboardingStyles.emptyContainer}>
              <Text style={onboardingStyles.emptyText}>{emptyText}</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
} 