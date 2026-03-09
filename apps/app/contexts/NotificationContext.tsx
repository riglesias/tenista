import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

// Conditionally import notification modules
let Notifications: any;
let NotificationService: any;

try {
  Notifications = require('expo-notifications');
  NotificationService = require('@/lib/services/notifications').NotificationService;
} catch (error) {
  console.log('Notifications not available in this environment');
}

interface NotificationContextValue {
  isNotificationEnabled: boolean;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Check and initialize notifications on mount
  useEffect(() => {
    // Skip if notifications not available
    if (!Notifications || !NotificationService) {
      console.log('Notifications not available in this environment');
      return;
    }
    
    checkNotificationPermissions();
    registerNotificationListeners();

    return () => {
      if (notificationListener.current && Notifications) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current && Notifications) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (user?.id && hasPermission) {
      registerForPushNotifications();
    }
  }, [user?.id, hasPermission]);

  const checkNotificationPermissions = async () => {
    if (Platform.OS === 'web' || !Notifications) {
      setHasPermission(false);
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.log('Error checking notification permissions:', error);
      setHasPermission(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !Notifications) {
      return false;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.log('Error requesting notification permissions:', error);
      return false;
    }
  };

  const registerForPushNotifications = async () => {
    if (!user?.id || !NotificationService) return;

    try {
      const token = await NotificationService.registerForPushNotifications();
      if (token) {
        await NotificationService.saveTokenToDatabase(token, user.id);
        console.log('Push token registered:', token);
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  };

  const registerNotificationListeners = () => {
    if (!NotificationService) return;
    
    // Handle notifications received while app is in foreground
    notificationListener.current = NotificationService.addNotificationReceivedListener((notification: any) => {
      console.log('Notification received:', notification);
    });

    // Handle notification taps
    responseListener.current = NotificationService.addNotificationResponseListener((response: any) => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type === 'play_now') {
        // Navigate to community tab to see available players
        router.push('/(tabs)/community');
      } else if (data?.type === 'match_result') {
        // Navigate to results tab to see match history
        router.push('/(tabs)/results');
      }
    });
  };

  const enableNotifications = async () => {
    if (!user?.id) return;

    try {
      // If notifications are available, try to get permission
      if (NotificationService && Notifications) {
        // First ensure we have permission
        let permitted = hasPermission;
        if (!permitted) {
          permitted = await requestPermission();
        }

        if (permitted) {
          // Register for push notifications
          await registerForPushNotifications();
        }
      }
      
      setIsNotificationEnabled(true);
      console.log('Notifications enabled');
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      throw error; // Re-throw to let the caller handle it
    }
  };

  const disableNotifications = async () => {
    if (!user?.id) return;

    try {
      // Remove token from database if service is available
      if (NotificationService) {
        await NotificationService.removeToken(user.id);
      }
      
      setIsNotificationEnabled(false);
      console.log('Notifications disabled');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      throw error; // Re-throw to let the caller handle it
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        isNotificationEnabled,
        enableNotifications,
        disableNotifications,
        hasPermission,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}