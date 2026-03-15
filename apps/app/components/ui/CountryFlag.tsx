import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

interface CountryFlagProps {
  countryCode: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: ViewStyle;
  borderRadius?: number;
}

const FONT_SIZE_MAP = {
  xs: 10,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 26,
};

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function CountryFlag({
  countryCode,
  size = 'md',
  style,
}: CountryFlagProps) {
  if (!countryCode || countryCode.length !== 2) {
    return null;
  }

  const fontSize =
    typeof size === 'number' ? size : FONT_SIZE_MAP[size];

  return (
    <View style={style}>
      <Text style={{ fontSize, lineHeight: fontSize * 1.2 }}>
        {getFlagEmoji(countryCode)}
      </Text>
    </View>
  );
}
