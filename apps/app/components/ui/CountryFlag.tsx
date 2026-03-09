import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface CountryFlagProps {
  countryCode: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: ViewStyle;
  borderRadius?: number;
}

const SIZE_MAP = {
  xs: { width: 12, height: 9 },
  sm: { width: 16, height: 12 },
  md: { width: 20, height: 15 },
  lg: { width: 24, height: 18 },
  xl: { width: 32, height: 24 },
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

  const code = countryCode.toLowerCase();
  const dimensions =
    typeof size === 'number'
      ? { width: size, height: Math.round(size * 0.75) }
      : SIZE_MAP[size];

  const flagUrl = `https://flagcdn.com/w80/${code}.png`;

  return (
    <View style={style}>
      <Image
        source={{ uri: flagUrl }}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius,
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </View>
  );
}
