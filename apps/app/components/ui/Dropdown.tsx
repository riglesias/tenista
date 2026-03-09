'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: DropdownOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function Dropdown({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  disabled = false,
}: DropdownProps) {
  useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      {/* Dropdown Button */}
      <TouchableOpacity
        className={`p-4 rounded-xl border ${
          disabled 
            ? 'opacity-50' 
            : ''
        } ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-300'
        }`}
        onPress={toggleDropdown}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-base font-medium flex-1 ${
              selectedOption
                ? isDark 
                  ? 'text-white' 
                  : 'text-gray-900'
                : isDark 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <Ionicons 
            name={isOpen ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
        </View>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          className="flex-1 justify-center items-center bg-black/50"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <TouchableOpacity 
            className={`mx-6 max-h-80 w-full max-w-sm rounded-xl border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-300'
            }`}
            activeOpacity={1}
          >
            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  className={`p-4 ${
                    index !== options.length - 1 
                      ? isDark 
                        ? 'border-b border-gray-700' 
                        : 'border-b border-gray-200'
                      : ''
                  }`}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-base font-medium ${
                      option.value === selectedValue
                        ? 'text-primary-500'
                        : isDark 
                          ? 'text-white' 
                          : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
} 