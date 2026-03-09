import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="sign-in"
        options={{
          title: 'Sign In',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="email-sign-in"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#ffffff',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#ffffff',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#ffffff',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="email-confirmation"
        options={{
          title: 'Email Confirmation',
          headerShown: false
        }}
      />
    </Stack>
  );
} 