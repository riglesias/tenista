import React, { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import BottomSheet from './BottomSheet'

export type SelectionOption = {
  label: string
  value: string
}

interface SelectionBottomSheetProps {
  visible: boolean
  onClose: () => void
  title: string
  options: SelectionOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
  searchable?: boolean
  placeholder?: string
  emptyText?: string
}

export default function SelectionBottomSheet({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  searchable = false,
  placeholder = 'Search...',
  emptyText = 'No options available',
}: SelectionBottomSheetProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [searchText, setSearchText] = useState('')

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : options

  const handleSelect = (value: string) => {
    onSelect(value)
    onClose()
    setSearchText('')
  }

  const handleClose = () => {
    onClose()
    setSearchText('')
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={[0.7]}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>

        {/* Search Input */}
        {searchable && (
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
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.foreground,
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        )}

        {/* Options List */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredOptions.length === 0 ? (
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
                {emptyText}
              </Text>
            </View>
          ) : (
            filteredOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: index === filteredOptions.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: option.value === selectedValue ? colors.primary : colors.foreground,
                    fontWeight: option.value === selectedValue ? '600' : '400',
                    flex: 1,
                  }}
                >
                  {option.label}
                </Text>
                {option.value === selectedValue && (
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
  )
}