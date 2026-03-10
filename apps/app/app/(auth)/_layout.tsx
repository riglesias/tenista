import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AuthLayout() {
  const { t } = useTranslation('auth');

  return (
    <Stack>
      <Stack.Screen
        name="sign-in"
        options={{
          title: t('layout.signInTitle'),
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
          headerBackTitle: t('layout.back'),
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#ffffff',
          headerBackTitle: t('layout.back'),
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#ffffff',
          headerBackTitle: t('layout.back'),
        }}
      />
      <Stack.Screen
        name="email-confirmation"
        options={{
          title: t('layout.emailConfirmationTitle'),
          headerShown: false
        }}
      />
    </Stack>
  );
} 