import { formatRating } from '@/constants/tennis-ratings';
import React from 'react';
import { Text, View } from 'react-native';

interface RatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

function getRatingColors(rating: number) {
  // Discrete color system based on rating ranges
  let color: string;
  
  if (rating < 1.25) {
    // 1.0 - Light Blue
    color = '135, 206, 235'; // Sky blue
  } else if (rating < 1.75) {
    // 1.5 - Blue  
    color = '59, 130, 246'; // Blue
  } else if (rating < 2.25) {
    // 2.0 - Light Green
    color = '134, 239, 172'; // Light green
  } else if (rating < 2.75) {
    // 2.5 - Green
    color = '34, 197, 94'; // Green
  } else if (rating < 3.25) {
    // 3.0 - Light Yellow
    color = '254, 240, 138'; // Light yellow
  } else if (rating < 3.75) {
    // 3.5 - Yellow
    color = '251, 191, 36'; // Yellow
  } else if (rating < 4.25) {
    // 4.0 - Light Orange
    color = '253, 186, 116'; // Light orange
  } else if (rating < 4.75) {
    // 4.5 - Orange
    color = '251, 146, 60'; // Orange
  } else if (rating < 5.25) {
    // 5.0 - Light Red
    color = '252, 165, 165'; // Light red
  } else {
    // 5.5+ - Red
    color = '239, 68, 68'; // Red
  }
  
  const textColor = `rgb(${color})`;
  const backgroundColor = `rgba(${color}, 0.2)`;
  
  return {
    textColor,
    backgroundColor,
  };
}

export default function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 4,
          fontSize: 10,
        };
      case 'lg':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          fontSize: 14,
        };
      default: // md
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const colors = getRatingColors(rating);

  return (
    <View
      style={{
        backgroundColor: colors.backgroundColor,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
        borderRadius: sizeStyles.borderRadius,
      }}
    >
      <Text
        style={{
          color: colors.textColor,
          fontSize: sizeStyles.fontSize,
          fontWeight: '600',
        }}
      >
        {formatRating(rating)}
      </Text>
    </View>
  );
}