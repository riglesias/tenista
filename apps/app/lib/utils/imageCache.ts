import { Image } from 'expo-image'

class ImageCacheManager {
  private static instance: ImageCacheManager
  private preloadedImages = new Set<string>()
  private preloadQueue: string[] = []
  private isPreloading = false

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager()
    }
    return ImageCacheManager.instance
  }

  // Preload multiple images in batch
  async preloadImages(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim() !== '')
    const newUrls = validUrls.filter(url => !this.preloadedImages.has(url))
    
    if (newUrls.length === 0) return

    // Add to queue
    this.preloadQueue.push(...newUrls)
    
    // Process queue if not already processing
    if (!this.isPreloading) {
      this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) {
      this.isPreloading = false
      return
    }

    this.isPreloading = true
    
    // Process in batches of 5
    const batch = this.preloadQueue.splice(0, 5)
    
    try {
      await Promise.all(
        batch.map(async (url) => {
          try {
            await Image.prefetch(url, 'memory-disk')
            this.preloadedImages.add(url)
          } catch (error) {
            // silently handled
          }
        })
      )
    } catch (error) {
      // silently handled
    }

    // Continue processing
    if (this.preloadQueue.length > 0) {
      // Small delay between batches
      setTimeout(() => this.processQueue(), 100)
    } else {
      this.isPreloading = false
    }
  }

  // Preload single image
  async preloadImage(url: string | null | undefined): Promise<void> {
    if (!url || typeof url !== 'string' || url.trim() === '') return
    if (this.preloadedImages.has(url)) return

    try {
      await Image.prefetch(url, 'memory-disk')
      this.preloadedImages.add(url)
    } catch (error) {
      // silently handled
    }
  }

  // Check if image is preloaded
  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url)
  }

  // Clear specific image from cache tracking
  // Note: expo-image doesn't support per-URL disk cache clearing,
  // so we just remove from tracking set; image will be re-fetched if needed
  clearImage(url: string): void {
    this.preloadedImages.delete(url)
  }

  // Clear all cached images
  clearAll(): void {
    this.preloadedImages.clear()
    Image.clearMemoryCache()
    Image.clearDiskCache()
  }
}

export const imageCache = ImageCacheManager.getInstance()

// Helper hook for preloading images
import { useEffect } from 'react'

export function usePreloadImages(urls: (string | null | undefined)[]): void {
  useEffect(() => {
    const validUrls = urls.filter((url): url is string => 
      url !== null && url !== undefined && url.trim() !== ''
    )
    
    if (validUrls.length > 0) {
      imageCache.preloadImages(validUrls)
    }
  }, [urls])
}