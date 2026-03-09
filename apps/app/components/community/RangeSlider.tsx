'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/utils/theme';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  values: [number, number];
  onValuesChange: (values: [number, number]) => void;
}

export function RangeSlider({
  min,
  max,
  step,
  values,
  onValuesChange
}: RangeSliderProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [sliderWidth, setSliderWidth] = useState(0);
  const containerRef = useRef<View>(null);
  
  // Animated values for smooth thumb movement
  const minThumbPosition = useSharedValue(0);
  const maxThumbPosition = useSharedValue(0);
  const minThumbScale = useSharedValue(1);
  const maxThumbScale = useSharedValue(1);
  const activeThumb = useSharedValue<'min' | 'max' | null>(null);
  
  // Track the last haptic value to avoid excessive feedback
  const lastHapticValue = useRef({ min: values[0], max: values[1] });
  
  // Track initial positions for gestures
  const initialMinPosition = useSharedValue(0);
  const initialMaxPosition = useSharedValue(0);

  // Convert value to position
  const valueToPosition = useCallback((value: number): number => {
    if (sliderWidth === 0) return 0;
    const percentage = (value - min) / (max - min);
    return percentage * sliderWidth;
  }, [sliderWidth, min, max]);


  // Initialize thumb positions when values or width changes
  React.useEffect(() => {
    if (sliderWidth > 0) {
      minThumbPosition.value = valueToPosition(values[0]);
      maxThumbPosition.value = valueToPosition(values[1]);
    }
  }, [values, sliderWidth, valueToPosition, minThumbPosition, maxThumbPosition]);

  // Haptic feedback handler
  const triggerHaptic = useCallback((value: number, type: 'min' | 'max') => {
    const lastValue = type === 'min' ? lastHapticValue.current.min : lastHapticValue.current.max;
    if (Math.abs(value - lastValue) >= step) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (type === 'min') {
        lastHapticValue.current.min = value;
      } else {
        lastHapticValue.current.max = value;
      }
    }
  }, [step]);

  // Update values with haptic feedback
  const updateValues = useCallback((newMin: number, newMax: number, thumbType: 'min' | 'max') => {
    // Ensure minimum gap of one step between min and max
    let validMin = newMin;
    let validMax = newMax;
    
    if (validMax - validMin < step) {
      if (thumbType === 'min') {
        // If adjusting min, keep max fixed and limit min
        validMin = Math.min(validMin, validMax - step);
      } else {
        // If adjusting max, keep min fixed and limit max
        validMax = Math.max(validMax, validMin + step);
      }
    }
    
    // Ensure values stay within bounds
    validMin = Math.max(min, Math.min(max - step, validMin));
    validMax = Math.min(max, Math.max(min + step, validMax));
    
    if (validMin !== values[0] || validMax !== values[1]) {
      onValuesChange([validMin, validMax]);
      triggerHaptic(thumbType === 'min' ? validMin : validMax, thumbType);
    }
  }, [values, onValuesChange, triggerHaptic, step, min, max]);

  // Create pan gesture for min thumb
  const minPanGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      activeThumb.value = 'min';
      minThumbScale.value = withSpring(1.2, { damping: 15 });
      initialMinPosition.value = minThumbPosition.value;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((event) => {
      'worklet';
      const newPosition = Math.max(0, Math.min(sliderWidth, initialMinPosition.value + event.translationX));
      
      // Convert position to value to check constraints
      const percentage = Math.max(0, Math.min(1, newPosition / sliderWidth));
      const rawValue = min + percentage * (max - min);
      const snappedValue = Math.round(rawValue / step) * step;
      const newMinValue = Math.max(min, Math.min(max, snappedValue));
      
      // Ensure minimum gap between min and max
      if (newMinValue <= values[1] - step) {
        minThumbPosition.value = newPosition;
        runOnJS(updateValues)(newMinValue, values[1], 'min');
      }
    })
    .onEnd(() => {
      activeThumb.value = null;
      minThumbScale.value = withSpring(1, { damping: 15 });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  // Create pan gesture for max thumb
  const maxPanGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      activeThumb.value = 'max';
      maxThumbScale.value = withSpring(1.2, { damping: 15 });
      initialMaxPosition.value = maxThumbPosition.value;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((event) => {
      'worklet';
      const newPosition = Math.max(0, Math.min(sliderWidth, initialMaxPosition.value + event.translationX));
      
      // Convert position to value to check constraints
      const percentage = Math.max(0, Math.min(1, newPosition / sliderWidth));
      const rawValue = min + percentage * (max - min);
      const snappedValue = Math.round(rawValue / step) * step;
      const newMaxValue = Math.max(min, Math.min(max, snappedValue));
      
      // Ensure minimum gap between min and max
      if (newMaxValue >= values[0] + step) {
        maxThumbPosition.value = newPosition;
        runOnJS(updateValues)(values[0], newMaxValue, 'max');
      }
    })
    .onEnd(() => {
      activeThumb.value = null;
      maxThumbScale.value = withSpring(1, { damping: 15 });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  // Animated styles for thumbs
  const minThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: minThumbPosition.value - 20 },
      { scale: minThumbScale.value }
    ],
    zIndex: activeThumb.value === 'min' ? 10 : 1,
  }));

  const maxThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: maxThumbPosition.value - 20 },
      { scale: maxThumbScale.value }
    ],
    zIndex: activeThumb.value === 'max' ? 10 : 1,
  }));

  // Animated style for the active range
  const rangeStyle = useAnimatedStyle(() => ({
    left: minThumbPosition.value,
    width: maxThumbPosition.value - minThumbPosition.value,
  }));

  // Handle layout to get slider width
  const handleLayout = useCallback((event: any) => {
    setSliderWidth(event.nativeEvent.layout.width);
  }, []);

  // Format value for display
  const formatValue = useCallback((value: number): string => {
    if (value >= 5) return '5.0+';
    return value.toFixed(1);
  }, []);

  // Tap gesture for the track
  const trackTapGesture = Gesture.Tap()
    .onEnd((event) => {
      'worklet';
      const tapX = event.x;
      const percentage = Math.max(0, Math.min(1, tapX / sliderWidth));
      const rawValue = min + percentage * (max - min);
      const snappedValue = Math.round(rawValue / step) * step;
      const newValue = Math.max(min, Math.min(max, snappedValue));
      
      // Determine which thumb to move based on proximity
      const minDistance = Math.abs(tapX - minThumbPosition.value);
      const maxDistance = Math.abs(tapX - maxThumbPosition.value);
      
      if (minDistance <= maxDistance && newValue <= values[1] - step) {
        // Move min thumb, ensure it stays at least one step below max
        minThumbPosition.value = withSpring(tapX);
        runOnJS(updateValues)(newValue, values[1], 'min');
      } else if (newValue >= values[0] + step) {
        // Move max thumb, ensure it stays at least one step above min
        maxThumbPosition.value = withSpring(tapX);
        runOnJS(updateValues)(values[0], newValue, 'max');
      }
      
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  return (
    <View style={{ paddingVertical: 16 }}>
      {/* Value Labels */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={{ 
            fontSize: 12, 
            color: colors.mutedForeground,
            fontWeight: '500',
            marginBottom: 2,
          }}>
            Min
          </Text>
          <Text style={{ 
            fontSize: 18, 
            color: colors.foreground,
            fontWeight: '700'
          }}>
            {formatValue(values[0])}
          </Text>
        </View>
        
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ 
            fontSize: 12, 
            color: colors.mutedForeground,
            fontWeight: '500',
            marginBottom: 2,
          }}>
            Max
          </Text>
          <Text style={{ 
            fontSize: 18, 
            color: colors.foreground,
            fontWeight: '700'
          }}>
            {formatValue(values[1])}
          </Text>
        </View>
      </View>

      {/* Slider Container */}
      <View 
        ref={containerRef}
        style={{ 
          height: 60, 
          justifyContent: 'center',
        }}
        onLayout={handleLayout}
      >
        <GestureDetector gesture={trackTapGesture}>
          <View style={{ 
            height: 60, 
            justifyContent: 'center',
            position: 'absolute',
            left: 0,
            right: 0,
          }}>
            {/* Track Background */}
            <View style={{
              height: 6,
              backgroundColor: colors.border,
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              {/* Active Range */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    height: 6,
                    backgroundColor: colors.primary,
                    borderRadius: 3,
                  },
                  rangeStyle
                ]}
              />
            </View>

            {/* Min Thumb */}
            <GestureDetector gesture={minPanGesture}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    top: 10,
                  },
                  minThumbStyle
                ]}
              >
                {/* Touch target (48x48) */}
                <View style={{
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: -4,
                  marginTop: -4,
                }}>
                  {/* Visible thumb (40x40) */}
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: colors.primary,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: colors.background,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 8,
                  }} />
                </View>
              </Animated.View>
            </GestureDetector>

            {/* Max Thumb */}
            <GestureDetector gesture={maxPanGesture}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    top: 10,
                  },
                  maxThumbStyle
                ]}
              >
                {/* Touch target (48x48) */}
                <View style={{
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: -4,
                  marginTop: -4,
                }}>
                  {/* Visible thumb (40x40) */}
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: colors.primary,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: colors.background,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 8,
                  }} />
                </View>
              </Animated.View>
            </GestureDetector>
          </View>
        </GestureDetector>
      </View>

      {/* Accessibility hint */}
      <Text style={{
        fontSize: 11,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7,
      }}>
        Drag sliders or tap to set rating range
      </Text>
    </View>
  );
}