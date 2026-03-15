import { supabase } from '@/lib/supabase';

export async function getUsersForPlayNowNotification(
  cityId: string,
  activatingUserId: string
) {

  // Get users who have:
  // 1. Play Now notifications enabled
  // 2. Are in the same city
  // 3. Are not the user activating Play Now
  // 4. Have notification tokens registered
  const { data: eligibleUsers, error } = await supabase
    .from('players')
    .select(`
      id,
      first_name,
      last_name,
      notification_tokens!inner(token),
      notification_preferences(
        play_now_notifications,
        notification_radius_km
      )
    `)
    .eq('city_id', cityId)
    .eq('play_now_notifications_enabled', true)
    .neq('id', activatingUserId);

  if (error) {
    return [];
  }

  // Filter users based on their notification preferences
  const usersToNotify = eligibleUsers?.filter(user => {
    const prefs = user.notification_preferences?.[0];
    return prefs?.play_now_notifications !== false;
  }) || [];

  return usersToNotify;
}

export async function logNotification(
  recipientUserId: string,
  senderUserId: string,
  notificationType: string,
  title: string,
  body: string,
  data?: any,
  status: 'sent' | 'failed' | 'pending' = 'sent',
  errorMessage?: string
) {

  const { error } = await supabase
    .from('notification_history')
    .insert({
      recipient_user_id: recipientUserId,
      sender_user_id: senderUserId,
      notification_type: notificationType,
      title,
      body,
      data,
      status,
      error_message: errorMessage,
    });

  if (error) {
    // silently handled
  }
}

export async function getNotificationHistory(userId: string) {

  const { data, error } = await supabase
    .from('notification_history')
    .select(`
      *,
      sender:sender_user_id(
        id,
        first_name,
        last_name
      )
    `)
    .eq('recipient_user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return data || [];
}

export async function getNewLeagueNotificationPreference(
  authUserId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('new_league_notifications')
    .eq('user_id', authUserId)
    .single();

  return data?.new_league_notifications === true;
}

export async function toggleNewLeagueNotification(
  authUserId: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: authUserId, new_league_notifications: enabled },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function updatePlayerNotificationPreference(
  authUserId: string,
  enabled: boolean
) {

  const { error } = await supabase
    .from('players')
    .update({ play_now_notifications_enabled: enabled })
    .eq('auth_user_id', authUserId);

  if (error) {
    throw error;
  }

  return { success: true };
}