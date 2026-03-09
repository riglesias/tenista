import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="flag-selection" />
      <Stack.Screen name="location" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="rating-selection" />
      <Stack.Screen name="availability" />
    </Stack>
  );
} 