import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  play_now_notifications: boolean;
  notification_radius_km: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export class NotificationService {
  static async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    try {
      // Get existing permissions status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('play-now', {
          name: 'Play Now Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#84FE0C',
          sound: 'default',
        });
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data;
    } catch (error) {
      return null;
    }
  }

  static async saveTokenToDatabase(token: string, userId: string): Promise<void> {
    try {
      const platform = Platform.OS as 'ios' | 'android' | 'web';
      const deviceId = Device.deviceName || 'unknown';

      const { error } = await supabase
        .from('notification_tokens')
        .upsert({
          user_id: userId,
          token,
          platform,
          device_id: deviceId,
        }, {
          onConflict: 'user_id,token',
        });

      if (error) {
        throw error;
      }

      // Create default notification preferences if they don't exist
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          play_now_notifications: true,
          notification_radius_km: 10,
        }, {
          onConflict: 'user_id',
        });

    } catch (error) {
      throw error;
    }
  }

  static async removeToken(userId: string): Promise<void> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      
      const { error } = await supabase
        .from('notification_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token.data);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  static async updatePlayNowNotificationStatus(
    userId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .update({ play_now_notifications_enabled: enabled })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: trigger || null,
    });

    return notificationId;
  }

  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  static addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}