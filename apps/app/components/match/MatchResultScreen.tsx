import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  AccessibilityInfo,
  Dimensions,
  Alert,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Share2, X, Download } from 'lucide-react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'
import {
  captureViewAsImage,
  shareImage,
  saveImageToLibrary,
  shareToInstagramStory,
} from '@/lib/utils/share'
import ShareableMatchCard from './ShareableMatchCard'

type CourtSurface = 'hard' | 'clay' | 'grass'

const COURT_SURFACES: CourtSurface[] = ['clay', 'hard', 'grass']
const DEFAULT_INDEX = 1 // hard court (middle)
const CARD_WIDTH = 300
const CARD_GAP = 16

interface PlayerData {
  id: string
  first_name: string | null
  last_name: string | null
  country_code: string | null
}

interface SetScore {
  player1: number
  player2: number
}

interface MatchResultScreenProps {
  visible: boolean
  isWinner: boolean
  currentPlayer: PlayerData
  opponent: PlayerData
  scores: SetScore[]
  matchDate: Date
  competitionName?: string
  onClose: () => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Instagram gradient colors
const INSTAGRAM_GRADIENT = ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'] as const

export default function MatchResultScreen({
  visible,
  isWinner,
  currentPlayer,
  opponent,
  scores,
  matchDate,
  competitionName,
  onClose,
}: MatchResultScreenProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { t } = useTranslation('match')

  const [reduceMotion, setReduceMotion] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(DEFAULT_INDEX)
  const [isSharing, setIsSharing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Refs for capturing
  const cardRefs = useRef<(View | null)[]>([])
  const scrollViewRef = useRef<ScrollView>(null)

  // Animation values
  const cardOpacity = useSharedValue(0)
  const cardTranslateY = useSharedValue(50)
  const buttonsOpacity = useSharedValue(0)

  const selectedSurface = COURT_SURFACES[selectedIndex]

  // Calculate scroll view padding to center cards
  const horizontalPadding = (SCREEN_WIDTH - CARD_WIDTH) / 2

  // Calculate snap offsets for each card to be centered
  const snapOffsets = COURT_SURFACES.map((_, index) => index * (CARD_WIDTH + CARD_GAP))

  // Check motion preferences
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled ?? false)
    })
  }, [])

  // Run entrance animations when visible
  useEffect(() => {
    if (visible) {
      // Reset values
      cardOpacity.value = 0
      cardTranslateY.value = 50
      buttonsOpacity.value = 0
      setSelectedIndex(DEFAULT_INDEX)
      // Reset scroll position to default (middle card) after a short delay
      setTimeout(() => {
        const defaultOffset = DEFAULT_INDEX * (CARD_WIDTH + CARD_GAP)
        scrollViewRef.current?.scrollTo({ x: defaultOffset, animated: false })
      }, 50)

      if (reduceMotion) {
        cardOpacity.value = 1
        cardTranslateY.value = 0
        buttonsOpacity.value = 1
      } else {
        cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }))
        cardTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 120 }))
        buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 300 }))
      }
    } else {
      setSelectedIndex(DEFAULT_INDEX)
    }
  }, [visible, isWinner, reduceMotion])

  // Handle scroll end to determine selected card
  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP))
    setSelectedIndex(Math.max(0, Math.min(index, COURT_SURFACES.length - 1)))
  }, [])

  // Capture the current card as an image
  const captureCard = useCallback(async (): Promise<string | null> => {
    try {
      const cardRef = cardRefs.current[selectedIndex]
      if (!cardRef) {
        console.error('Card ref not available for index:', selectedIndex)
        return null
      }

      const uri = await captureViewAsImage({ current: cardRef }, {
        format: 'jpg',
        quality: 0.85,
        width: 1080,
        height: 1224,
      })
      return uri
    } catch (error) {
      console.error('Error capturing card:', error)
      return null
    }
  }, [selectedIndex])

  // Handle Instagram Story share
  const handleShareToInstagram = useCallback(async () => {
    setIsSharing(true)
    try {
      const uri = await captureCard()
      if (!uri) {
        Alert.alert('Error', 'Failed to capture image. Please try again.')
        return
      }

      const result = await shareToInstagramStory(uri)
      if (result.fallback) {
        await shareImage(uri)
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error)
      Alert.alert('Error', 'Failed to share to Instagram. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }, [captureCard])

  // Handle save to device
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const uri = await captureCard()
      if (!uri) {
        Alert.alert('Error', 'Failed to capture image. Please try again.')
        return
      }

      const result = await saveImageToLibrary(uri)
      if (result.success) {
        Alert.alert('Saved', 'Image saved to your photo library!')
      } else {
        Alert.alert('Error', result.error || 'Failed to save image.')
      }
    } catch (error) {
      console.error('Error saving:', error)
      Alert.alert('Error', 'Failed to save image. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [captureCard])

  // Handle generic share
  const handleShare = useCallback(async () => {
    setIsSharing(true)
    try {
      const uri = await captureCard()
      if (!uri) {
        Alert.alert('Error', 'Failed to capture image. Please try again.')
        return
      }

      await shareImage(uri)
    } catch (error) {
      console.error('Error sharing:', error)
      Alert.alert('Error', 'Failed to share image. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }, [captureCard])

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }))

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }))

  const surfaceLabels: Record<CourtSurface, string> = {
    hard: 'Hard Court',
    clay: 'Clay Court',
    grass: 'Grass Court',
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.muted }]}
          onPress={onClose}
          accessibilityLabel={t('celebration.done')}
          accessibilityRole="button"
        >
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title & Description */}
          <Animated.View style={[styles.headerContainer, cardAnimatedStyle]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {isWinner ? t('celebration.victoryTitle') : t('celebration.defeatTitle')}
            </Text>
            <Text style={[styles.headerDescription, { color: colors.mutedForeground }]}>
              {t('celebration.shareDescription')}
            </Text>
          </Animated.View>

          {/* Swipeable Cards */}
          <Animated.View style={[styles.carouselContainer, cardAnimatedStyle]}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToOffsets={snapOffsets}
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
              }}
              onMomentumScrollEnd={handleScrollEnd}
            >
              {COURT_SURFACES.map((surface, index) => (
                <View
                  key={surface}
                  style={[
                    styles.cardWrapper,
                    index < COURT_SURFACES.length - 1 && { marginRight: CARD_GAP },
                  ]}
                >
                  <View
                    ref={(ref) => { cardRefs.current[index] = ref }}
                    collapsable={false}
                  >
                    <ShareableMatchCard
                      isWinner={isWinner}
                      currentPlayer={currentPlayer}
                      opponent={opponent}
                      scores={scores}
                      matchDate={matchDate}
                      competitionName={competitionName}
                      courtSurface={surface}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Page Indicator */}
          <Animated.View style={[styles.indicatorContainer, buttonsAnimatedStyle]}>
            <View style={styles.dotsRow}>
              {COURT_SURFACES.map((surface, index) => (
                <View
                  key={surface}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === selectedIndex
                        ? colors.primary
                        : colors.muted,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.surfaceLabel, { color: colors.mutedForeground }]}>
              {surfaceLabels[selectedSurface]}
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
            {/* Instagram Story Button (Primary) */}
            <TouchableOpacity
              style={styles.instagramButton}
              onPress={handleShareToInstagram}
              disabled={isSharing}
              accessibilityLabel="Share to Instagram Story"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={INSTAGRAM_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.instagramButtonGradient}
              >
                <InstagramIcon />
                <Text style={styles.instagramButtonText}>
                  {isSharing ? 'Sharing...' : 'Share to Story'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Buttons Row */}
            <View style={styles.secondaryButtonsRow}>
              {/* Save Button */}
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.muted }]}
                onPress={handleSave}
                disabled={isSaving}
                accessibilityLabel="Save to device"
                accessibilityRole="button"
              >
                <Download size={20} color={colors.foreground} />
                <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>

              {/* Share Button */}
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.muted }]}
                onPress={handleShare}
                disabled={isSharing}
                accessibilityLabel="Share"
                accessibilityRole="button"
              >
                <Share2 size={20} color={colors.foreground} />
                <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  )
}

// Simple Instagram icon component (white)
function InstagramIcon() {
  return (
    <View style={styles.instagramIcon}>
      <View style={styles.instagramIconOuter} />
      <View style={styles.instagramIconInner} />
      <View style={styles.instagramIconDot} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 15,
    fontWeight: '400',
  },
  carouselContainer: {
    marginBottom: 16,
  },
  cardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  surfaceLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 32,
  },
  instagramButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  instagramButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  instagramButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instagramIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramIconOuter: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  instagramIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  instagramIconDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 3,
    right: 3,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
})
