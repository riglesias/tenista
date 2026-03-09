export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      notification_history: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          notification_type: string
          recipient_user_id: string
          sender_user_id: string | null
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_user_id: string
          sender_user_id?: string | null
          sent_at?: string | null
          status: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_user_id?: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          notification_radius_km: number | null
          play_now_notifications: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_radius_km?: number | null
          play_now_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_radius_km?: number | null
          play_now_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_tokens: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
  }
}