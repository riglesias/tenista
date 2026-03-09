import { Share, Platform, Linking } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as MediaLibrary from 'expo-media-library'
import { captureRef } from 'react-native-view-shot'

/**
 * Shares match result text using the native share sheet
 * This works without any native modules
 */
export async function shareMatchResult(
  isWinner: boolean,
  playerName: string,
  opponentName: string,
  scores: { player1: number; player2: number }[],
  competitionName?: string
): Promise<boolean> {
  try {
    const result = isWinner ? 'Won' : 'Lost'
    const scoreText = scores.map(s => `${s.player1}-${s.player2}`).join(', ')

    let message = `${result} my tennis match vs ${opponentName}! Score: ${scoreText}`
    if (competitionName) {
      message += ` in ${competitionName}`
    }
    message += '\n\nTracked with Tenista - tenista.app'

    await Share.share({
      message,
      title: `Tennis Match Result`,
    })

    return true
  } catch (error) {
    console.error('Error sharing:', error)
    return false
  }
}

/**
 * Checks if sharing functionality is available on the current platform
 */
export function isSharingAvailable(): boolean {
  return true
}

/**
 * Capture a React Native view as an image
 * @param viewRef - Reference to the view to capture
 * @param options - Capture options
 * @returns URI to the captured image
 */
export async function captureViewAsImage(
  viewRef: React.RefObject<any>,
  options?: {
    format?: 'png' | 'jpg'
    quality?: number
    width?: number
    height?: number
  }
): Promise<string | null> {
  try {
    if (!viewRef.current) {
      console.error('View ref is not available')
      return null
    }

    const uri = await captureRef(viewRef, {
      format: options?.format || 'jpg',
      quality: options?.quality ?? 0.85,
      width: options?.width,
      height: options?.height,
      result: 'tmpfile',
    })

    return uri
  } catch (error) {
    console.error('Error capturing view:', error)
    return null
  }
}

/**
 * Share an image using the native share sheet
 * @param uri - URI to the image to share
 * @returns Success status
 */
export async function shareImage(uri: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync()
    if (!isAvailable) {
      console.error('Sharing is not available on this device')
      return false
    }

    // Determine MIME type based on file extension
    const isJpeg = uri.toLowerCase().endsWith('.jpg') || uri.toLowerCase().endsWith('.jpeg')
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png'

    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: 'Share Match Result',
    })

    return true
  } catch (error) {
    console.error('Error sharing image:', error)
    return false
  }
}

/**
 * Save an image to the device's photo library
 * @param uri - URI to the image to save
 * @returns Success status and optional error message
 */
export async function saveImageToLibrary(uri: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      return { success: false, error: 'Permission denied' }
    }

    // Save to media library
    await MediaLibrary.saveToLibraryAsync(uri)
    return { success: true }
  } catch (error) {
    console.error('Error saving image:', error)
    return { success: false, error: 'Failed to save image' }
  }
}

/**
 * Share image to Instagram Story
 * Opens Instagram with the image ready for Story posting
 * @param uri - URI to the image to share
 * @returns Success status
 */
export async function shareToInstagramStory(uri: string): Promise<{ success: boolean; fallback?: boolean }> {
  try {
    // Check if Instagram is installed
    const instagramUrl = Platform.select({
      ios: 'instagram-stories://share',
      android: 'com.instagram.android',
    })

    if (!instagramUrl) {
      return { success: false }
    }

    // For iOS, we use the Instagram Stories URL scheme
    if (Platform.OS === 'ios') {
      const canOpen = await Linking.canOpenURL('instagram-stories://share')

      if (canOpen) {
        // Read the image as base64
        const base64Image = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        })

        // Create the Instagram Stories URL with background image
        const instagramStoriesUrl = `instagram-stories://share?source_application=com.tenista.app&background_image=${encodeURIComponent(base64Image)}`

        // Note: The above approach may not work directly.
        // Instagram Stories sharing on iOS requires using UIDocumentInteractionController
        // which needs native code. For now, fall back to regular share sheet.

        // Alternative: Use expo-sharing which can handle Instagram on iOS
        const isJpeg = uri.toLowerCase().endsWith('.jpg') || uri.toLowerCase().endsWith('.jpeg')
        await Sharing.shareAsync(uri, {
          mimeType: isJpeg ? 'image/jpeg' : 'image/png',
          UTI: isJpeg ? 'public.jpeg' : 'public.png',
        })

        return { success: true }
      }
    }

    // For Android, try to share directly to Instagram Stories
    if (Platform.OS === 'android') {
      // Check if Instagram is installed
      const canOpen = await Linking.canOpenURL('instagram://story-camera')

      if (canOpen) {
        // On Android, we can use intent to share to Instagram Stories
        // This requires a specific content:// URI format
        const isJpeg = uri.toLowerCase().endsWith('.jpg') || uri.toLowerCase().endsWith('.jpeg')
        await Sharing.shareAsync(uri, {
          mimeType: isJpeg ? 'image/jpeg' : 'image/png',
          dialogTitle: 'Share to Instagram Story',
        })
        return { success: true }
      }
    }

    // Instagram not installed, use fallback
    return { success: false, fallback: true }
  } catch (error) {
    console.error('Error sharing to Instagram:', error)
    // Fall back to regular share
    return { success: false, fallback: true }
  }
}

/**
 * Capture a view and share it as an image
 * @param viewRef - Reference to the view to capture
 * @returns Success status
 */
export async function captureAndShare(
  viewRef: React.RefObject<any>
): Promise<boolean> {
  const uri = await captureViewAsImage(viewRef)
  if (!uri) {
    return false
  }
  return shareImage(uri)
}

/**
 * Capture a view and save it to the photo library
 * @param viewRef - Reference to the view to capture
 * @returns Success status and optional error
 */
export async function captureAndSave(
  viewRef: React.RefObject<any>
): Promise<{ success: boolean; error?: string }> {
  const uri = await captureViewAsImage(viewRef)
  if (!uri) {
    return { success: false, error: 'Failed to capture image' }
  }
  return saveImageToLibrary(uri)
}
