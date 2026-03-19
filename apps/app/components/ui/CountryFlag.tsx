import React from 'react';
import { Image, View, ViewStyle } from 'react-native';

interface CountryFlagProps {
  countryCode: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: ViewStyle;
  borderRadius?: number;
}

// Pixel dimensions (width) for each named size — flags are 3:2 aspect ratio
const SIZE_MAP = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
};

export default function CountryFlag({
  countryCode,
  size = 'md',
  style,
  borderRadius = 2,
}: CountryFlagProps) {
  if (!countryCode || countryCode.length !== 2) {
    return null;
  }

  const width = typeof size === 'number' ? size : SIZE_MAP[size];
  const height = Math.round(width * (2 / 3));
  const code = countryCode.toLowerCase();

  return (
    <View style={style}>
      <Image
        source={{ uri: `https://flagcdn.com/w80/${code}.png` }}
        style={{ width, height, borderRadius }}
        resizeMode="cover"
      />
    </View>
  );
}
