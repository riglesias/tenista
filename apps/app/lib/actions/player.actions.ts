import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'

// Lazy load ImageManipulator to prevent crash in Expo Go
let ImageManipulator: typeof import('expo-image-manipulator') | null = null

async function getImageManipulator() {
  if (!ImageManipulator) {
    try {
      ImageManipulator = await import('expo-image-manipulator')
    } catch (error) {
      console.warn('expo-image-manipulator not available (running in Expo Go?)')
      return null
    }
  }
  return ImageManipulator
}

type PlayerProfile = Database['public']['Tables']['players']['Insert']
type CreateOrUpdatePlayerProfile = Partial<PlayerProfile>

export async function createOrUpdatePlayerProfile(
  userId: string,
  profile: Partial<PlayerProfile>
) {
  try {
    // First check if player profile exists
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    if (existingPlayer) {
      // Update existing profile
      const { data, error } = await supabase
        .from('players')
        .update(profile)
        .eq('auth_user_id', userId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('players')
        .insert({
          ...profile,
          auth_user_id: userId,
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('Error creating/updating player profile:', error)
    return { data: null, error }
  }
}

export async function getPlayerProfile(userId?: string) {
  try {
    let targetUserId = userId;
    
    // If no userId provided, get current authenticated user
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('No authenticated user') };
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('auth_user_id', targetUserId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching player profile:', error)
    return { data: null, error }
  }
}

export async function getPlayerById(playerId: string) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching player by ID:', error)
    return { data: null, error }
  }
}

export async function togglePlayerActiveStatus(playerId: string, isActive: boolean) {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({ is_active: isActive })
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error toggling player active status:', error)
    return { data: null, error }
  }
}

export async function getAllPlayers(includeInactive: boolean = false) {
  try {
    let query = supabase
      .from('players')
      .select('*')

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching players:', error)
    return { data: null, error }
  }
}

// Resize image to max 512x512 for optimal storage and performance
async function resizeImage(uri: string): Promise<string> {
  try {
    const manipulator = await getImageManipulator()
    if (!manipulator) {
      console.warn('ImageManipulator not available, using original image')
      return uri
    }
    const result = await manipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512 } }],
      { compress: 0.8, format: manipulator.SaveFormat.JPEG }
    )
    return result.uri
  } catch (error) {
    console.warn('Image resize failed, using original:', error)
    return uri // Fallback to original if resize fails
  }
}

// Delete old avatars for user to prevent storage bloat
async function deleteOldAvatars(userId: string): Promise<void> {
  try {
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId)

    if (existingFiles?.length) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`)
      await supabase.storage.from('avatars').remove(filesToDelete)
      console.log(`Deleted ${filesToDelete.length} old avatar(s) for user ${userId}`)
    }
  } catch (error) {
    console.warn('Failed to delete old avatars:', error)
    // Non-critical, continue with upload
  }
}

export async function uploadAvatar(userId: string, avatarUri: string): Promise<{ url: string | null, error: any }> {
  try {
    // Check if the URI is already a Supabase URL (i.e., already uploaded)
    if (avatarUri.includes('supabase')) {
      return { url: avatarUri, error: null };
    }

    // Get Supabase auth session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No authenticated session');
    }

    console.log(`Uploading avatar for platform: ${Platform.OS}`);
    console.log(`Original file URI: ${avatarUri}`);

    // Resize image before upload for better performance
    const resizedUri = await resizeImage(avatarUri);
    console.log(`Resized file URI: ${resizedUri}`);

    // Delete old avatars to prevent storage bloat
    await deleteOldAvatars(userId);

    // Create a unique file name (always .jpg since we convert to JPEG)
    const fileName = `${userId}/${Date.now()}.jpg`;
    const mimeType = 'image/jpeg';

    // Platform-specific upload logic
    if (Platform.OS === 'web') {
      // Web platform: Handle blob/File objects efficiently
      let uploadData: Blob | File;

      if (resizedUri.startsWith('blob:') || resizedUri.startsWith('data:')) {
        // For web, we might get blob URLs or data URLs
        const response = await fetch(resizedUri);
        uploadData = await response.blob();
      } else {
        // For regular URLs
        const response = await fetch(resizedUri);
        uploadData = await response.blob();
      }
      
      console.log(`Web upload - Blob size: ${uploadData.size} bytes`);
      
      // Use Supabase's standard upload for web
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, uploadData, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Web upload error:', error);
        return { url: null, error };
      }

      // Get the public URL
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return { url: publicUrl.publicUrl, error: null };
      
    } else {
      // Mobile platform (iOS/Android): Use FileSystem for efficient binary upload
      try {
        // First, check if FileSystem is available
        if (!FileSystem || !FileSystem.uploadAsync) {
          throw new Error('FileSystem not available, falling back to blob upload');
        }

        const { data: { publicUrl: projectUrl } } = await supabase.storage.from('avatars').getPublicUrl('dummy');
        const baseUrl = projectUrl.replace('/object/public/avatars/dummy', '');
        const uploadUrl = `${baseUrl}/object/avatars/${fileName}`;
        
        console.log(`Mobile upload - Using FileSystem.uploadAsync`);
        
        const uploadResult = await FileSystem.uploadAsync(
          uploadUrl,
          resizedUri,
          {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': mimeType,
              'x-upsert': 'true',
              'cache-control': 'max-age=3600'
            }
          }
        );

        if (uploadResult.status !== 200 && uploadResult.status !== 201) {
          console.error('Mobile upload failed with status:', uploadResult.status);
          throw new Error(`Upload failed with status ${uploadResult.status}`);
        }

        // Get the public URL
        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        return { url: publicUrl.publicUrl, error: null };
        
      } catch (mobileError) {
        // Fallback for mobile if FileSystem fails
        console.log('Mobile FileSystem upload failed, falling back to blob upload:', mobileError);

        const response = await fetch(resizedUri);
        const blob = await response.blob();
        
        console.log(`Mobile fallback - Blob size: ${blob.size} bytes`);
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: mimeType,
            upsert: true,
            cacheControl: '3600',
          });

        if (error) {
          console.error('Mobile fallback upload error:', error);
          return { url: null, error };
        }

        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        return { url: publicUrl.publicUrl, error: null };
      }
    }
  } catch (error) {
    console.error('Avatar upload exception:', error);
    return { url: null, error };
  }
} 