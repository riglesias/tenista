'use client'

import { useAuth } from '@/contexts/AuthContext';
import { getPlayerProfile } from '@/lib/actions/player.actions';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Add minimum loading display time to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (authLoading) return;

      // No user - redirect to sign in
      if (!user) {
        setRedirectPath('/(auth)/sign-in');
        setIsChecking(false);
        return;
      }

      // User exists - check onboarding status
      try {
        const { data: profile } = await getPlayerProfile(user.id);
        const completed = profile?.onboarding_completed === true;
        
        if (!completed) {
          setRedirectPath('/onboarding/profile');
        } else {
          setRedirectPath('/(tabs)/community');
        }
      } catch (error) {
        setRedirectPath('/onboarding/profile');
      }
      
      setIsChecking(false);
    };

    checkUserStatus();
  }, [user, authLoading]);

  // Show loading while checking (with minimum display time to prevent flash)
  if (authLoading || isChecking || !redirectPath || !minTimeElapsed) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return <Redirect href={redirectPath as any} />;
} 