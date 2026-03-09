'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { uploadAvatar } from '@/lib/actions/player.actions';
import { getThemeColors } from '@/lib/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import CachedImage from '@/components/ui/CachedImage';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, TouchableOpacity, View } from 'react-native';

interface AvatarPickerProps {
  avatarUrl: string | null;
  onAvatarChange: (url: string) => void;
  userId: string;
  firstName?: string;
  size?: number;
  showEditButton?: boolean;
  disabled?: boolean;
}

// Memoized FallbackAvatar component
const FallbackAvatar = React.memo(({ 
  firstName, 
  size, 
  colors 
}: { 
  firstName: string; 
  size: number; 
  colors: ReturnType<typeof getThemeColors> 
}) => {
  const radius = size / 2;
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: radius,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ 
        fontSize: size * 0.3, 
        fontWeight: 'bold', 
        color: colors.primaryForeground 
      }}>
        {firstName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
});

FallbackAvatar.displayName = 'FallbackAvatar';

const AvatarPicker = React.memo(({
  avatarUrl,
  onAvatarChange,
  userId,
  firstName = 'P',
  size = 96,
  showEditButton = true,
  disabled = false,
}: AvatarPickerProps) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [uploading, setUploading] = useState(false);

  const handleImagePick = useCallback(async () => {
    if (disabled || !userId || uploading) return;

    try {
      // Set uploading state immediately to prevent multiple launches
      setUploading(true);
      
      // Check if ImagePicker is available
      if (!ImagePicker || !ImagePicker.requestMediaLibraryPermissionsAsync) {
        Alert.alert('Error', 'Image picker is not available on this platform.');
        setUploading(false);
        return;
      }
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        setUploading(false);
        return;
      }

      // Optimize image quality based on size
      const quality = size > 150 ? 0.8 : 0.6;
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: Platform.OS === 'web' ? Math.min(quality, 0.5) : quality,
        base64: false, // Don't use base64 for efficiency
      });

      if (result.canceled) {
        // User canceled, just reset uploading state
        setUploading(false);
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];

        // Validate the asset has a URI
        if (!asset.uri) {
          Alert.alert('Error', 'Selected image is invalid. Please try another image.');
          setUploading(false);
          return;
        }

        // Validate file size (5MB limit)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            'Image Too Large',
            'Please select an image smaller than 5MB.'
          );
          setUploading(false);
          return;
        }

        // Keep uploading state true during actual upload
        const { url, error } = await uploadAvatar(userId, asset.uri);
        
        if (error) {
          Alert.alert('Upload Error', 'Failed to upload profile picture. Please try again.');
          console.error('Avatar upload error:', error);
        } else if (url) {
          onAvatarChange(url);
        } else {
          Alert.alert('Error', 'Upload completed but no URL was returned. Please try again.');
        }
      }
      
      // Always reset uploading state when done
      setUploading(false);
    } catch (error) {
      console.error('Image picker error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', `${errorMessage}. Please try again.`);
      setUploading(false);
    }
  }, [disabled, userId, uploading, onAvatarChange, size]);

  const radius = size / 2;
  const editButtonSize = Math.max(24, size * 0.25);
  const editButtonRadius = editButtonSize / 2;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          onPress={showEditButton ? undefined : handleImagePick}
          disabled={disabled || uploading}
          style={{ opacity: disabled ? 0.6 : 1 }}
        >
          <CachedImage
            source={avatarUrl}
            style={{ width: size, height: size, borderRadius: radius }}
            priority="high"
            showLoading={true}
            loadingSize="small"
            fallback={<FallbackAvatar firstName={firstName} size={size} colors={colors} />}
          />
        </TouchableOpacity>
        
        {/* Edit Button */}
        {showEditButton && (
          <TouchableOpacity
            onPress={handleImagePick}
            disabled={disabled || uploading}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: editButtonSize,
              height: editButtonSize,
              borderRadius: editButtonRadius,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.background,
            }}
          >
            {uploading ? (
              <ActivityIndicator 
                size="small" 
                color={colors.primaryForeground} 
              />
            ) : (
              <Ionicons 
                name="camera" 
                size={editButtonSize * 0.5} 
                color={colors.primaryForeground} 
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

AvatarPicker.displayName = 'AvatarPicker';

export default AvatarPicker; 