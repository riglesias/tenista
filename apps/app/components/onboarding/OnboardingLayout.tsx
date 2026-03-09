'use client'

import React from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTheme } from '@/contexts/ThemeContext';
import { createOnboardingStyles } from './onboarding-styles';

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  buttons?: React.ReactNode;
  scrollable?: boolean;
  keyboardAware?: boolean;
  contentStyle?: ViewStyle;
  showBottomSpace?: boolean;
}

export function OnboardingLayout({
  title,
  subtitle,
  children,
  buttons,
  scrollable = true,
  keyboardAware = false,
  contentStyle,
  showBottomSpace = true,
}: OnboardingLayoutProps) {
  const { isDark } = useTheme();
  const onboardingStyles = createOnboardingStyles(isDark);
  
  // Calculate button container height: button height + padding + safe area
  const buttonContainerHeight = 56 + 48 + (Platform.OS === 'ios' ? 34 : 24);
  
  const content = (
    <>
      <Text style={onboardingStyles.title}>{title}</Text>
      {subtitle && <Text style={onboardingStyles.subtitle}>{subtitle}</Text>}
      {children}
      {showBottomSpace && buttons && <View style={{ height: buttonContainerHeight }} />}
    </>
  );

  if (!scrollable) {
    return (
      <SafeAreaView style={onboardingStyles.container}>
        <View style={[
          styles.content, 
          contentStyle,
          buttons ? { paddingBottom: buttonContainerHeight } : {}
        ]}>
          {content}
        </View>
        {buttons}
      </SafeAreaView>
    );
  }

  if (keyboardAware) {
    return (
      <SafeAreaView style={onboardingStyles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraScrollHeight={Platform.OS === 'ios' ? 50 : 0}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardOpeningTime={0}
        >
          {content}
        </KeyboardAwareScrollView>
        {buttons}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={onboardingStyles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {content}
      </ScrollView>
      {buttons}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 80, // Add space for back button
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80, // Add space for back button
    flexGrow: 1,
  },
}); 