'use client'

import ScreenHeader from '@/components/ui/ScreenHeader'
import { useAppToast } from '@/components/ui/Toast'
import { useTheme } from '@/contexts/ThemeContext'
import { SubmitMatchData, submitMatchResult } from '@/lib/actions/matches.actions'
import { getPlayerById, getPlayerProfile } from '@/lib/actions/player.actions'
import { getPlayerActiveCompetitions, PlayerCompetition } from '@/lib/actions/competitions.actions'
import { completeChallenge, getActiveChallenge, editLadderMatchResult } from '@/lib/actions/ladder.actions'
import { getThemeColors } from '@/lib/utils/theme'
import {
  LadderMatchFormat,
  DEFAULT_LADDER_MATCH_FORMAT,
  DEFAULT_LADDER_CONFIG,
  LadderConfig,
  MatchFormat,
  DEFAULT_MATCH_FORMAT,
  matchFormatToLadderFormat
} from '@/lib/validation/leagues.validation'
import {
  validateMatchScore,
  validateSuperTiebreak,
  getMatchFormatDescription,
  SetScore as LadderSetScore,
  SuperTiebreakScore
} from '@/lib/validation/ladder.validation'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Info } from 'lucide-react-native'
import MatchResultScreen from '@/components/match/MatchResultScreen'

interface SetScore {
  player1: number
  player2: number
}

interface ChallengeContext {
  challengeId: string
  leagueId: string
  opponentId: string
  matchFormat: LadderMatchFormat
  leagueName: string
}

interface PlayoffContext {
  playoffTournamentId: string
  leagueId: string
  opponentId: string
  matchFormat: MatchFormat
  leagueName: string
}

interface PlayerData {
  id: string
  first_name: string | null
  last_name: string | null
  nationality_code: string | null
  rating: number | null
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default function SubmitResultScreen() {
  const { opponentId, challengeId, leagueId, isPlayoff, playoffTournamentId, editMatchId, editMode } = useLocalSearchParams<{
    opponentId?: string
    challengeId?: string
    leagueId?: string
    isPlayoff?: string
    playoffTournamentId?: string
    editMatchId?: string
    editMode?: string
  }>()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const queryClient = useQueryClient()
  const { showToast } = useAppToast()
  const { t } = useTranslation('match')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [opponent, setOpponent] = useState<PlayerData | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null)
  const [competitions, setCompetitions] = useState<PlayerCompetition[]>([])

  // Ladder challenge context
  const [challengeContext, setChallengeContext] = useState<ChallengeContext | null>(null)
  const [superTiebreakScore, setSuperTiebreakScore] = useState<SuperTiebreakScore>({ player1: 0, player2: 0 })
  const [showSuperTiebreak, setShowSuperTiebreak] = useState(false)

  // Playoff context
  const [playoffContext, setPlayoffContext] = useState<PlayoffContext | null>(null)

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [editMatchIdState, setEditMatchIdState] = useState<string | null>(null)

  // Determine if this is a ladder challenge match or playoff match
  const isLadderMatch = !!challengeContext
  const isPlayoffMatch = !!playoffContext
  
  // Form state
  const [matchDate, setMatchDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [numberOfSets, setNumberOfSets] = useState<1 | 3 | 5>(3)
  const [gameType, setGameType] = useState<'practice' | 'competitive'>('competitive')
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles')
  const [selectedCompetition, setSelectedCompetition] = useState<PlayerCompetition | null>(null)
  const [scores, setScores] = useState<SetScore[]>([
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 }
  ])
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Celebration screen state
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationData, setCelebrationData] = useState<{
    isWinner: boolean
    scores: { player1: number; player2: number }[]
    matchDate: Date
    competitionName?: string
  } | null>(null)
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({}).current
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null)
  const scoreViewRef = useRef<View>(null)

  useEffect(() => {
    loadData()
  }, [opponentId, challengeId, leagueId, isPlayoff, playoffTournamentId, editMatchId, editMode])

  useEffect(() => {
    // Update scores array based on number of sets
    setScores(prevScores => {
      const newScores = Array.from({ length: numberOfSets }, (_, index) => 
        prevScores[index] || { player1: 0, player2: 0 }
      )
      return newScores
    })
  }, [numberOfSets])

  useEffect(() => {
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    )
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    )

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const loadData = async () => {
    try {
      // Load current player data first
      const { data: userData } = await getPlayerProfile('')
      if (!userData) {
        showToast(t('submitResult.couldNotLoadData'), { type: 'error' })
        router.back()
        return
      }
      setCurrentPlayer(userData)

      // If this is a ladder challenge (new or edit), load challenge context
      if (challengeId && leagueId) {
        // In edit mode, load the existing match data
        if (editMode === 'true' && editMatchId) {
          // Load the existing match to pre-fill
          const { data: existingMatch } = await supabase
            .from('player_matches')
            .select('*')
            .eq('id', editMatchId)
            .single()

          if (!existingMatch) {
            showToast('Could not load match data', { type: 'error' })
            router.back()
            return
          }

          // Get opponent from match
          const matchOpponentId = existingMatch.player1_id === userData.id
            ? existingMatch.player2_id
            : existingMatch.player1_id

          // Load opponent data
          const { data: opponentData, error: opponentError } = await getPlayerById(matchOpponentId)
          if (opponentError || !opponentData) {
            showToast(t('submitResult.couldNotLoadOpponent'), { type: 'error' })
            router.back()
            return
          }
          setOpponent(opponentData)

          // Load league data for match format
          const { data: league } = await supabase
            .from('leagues')
            .select('name, ladder_config, match_format')
            .eq('id', leagueId)
            .single()

          const ladderConfig: LadderConfig = league?.ladder_config || DEFAULT_LADDER_CONFIG
          const matchFormat = ladderConfig.match_format
            || (league?.match_format ? matchFormatToLadderFormat(league.match_format) : DEFAULT_LADDER_MATCH_FORMAT)

          // Set challenge context
          setChallengeContext({
            challengeId,
            leagueId,
            opponentId: matchOpponentId,
            matchFormat,
            leagueName: league?.name || 'Ladder Competition'
          })

          // Set edit mode state
          setIsEditMode(true)
          setEditMatchIdState(editMatchId)

          // Set number of sets based on match format
          setNumberOfSets(matchFormat.number_of_sets as 1 | 3 | 5)

          // Pre-fill scores from existing match
          const existingScores = existingMatch.scores || []
          const mappedScores = existingScores.map((s: { player1: number; player2: number }) => ({
            player1: existingMatch.player1_id === userData.id ? s.player1 : s.player2,
            player2: existingMatch.player1_id === userData.id ? s.player2 : s.player1,
          }))
          setScores(mappedScores.length > 0 ? mappedScores : Array.from({ length: matchFormat.number_of_sets }, () => ({ player1: 0, player2: 0 })))

          // Pre-fill date
          if (existingMatch.match_date) {
            setMatchDate(new Date(existingMatch.match_date))
          }

          setGameType('competitive')
        } else {
          // Regular new challenge flow
          const { data: challenge, error: challengeError } = await getActiveChallenge(leagueId, userData.id)

          if (challengeError || !challenge) {
            showToast('Could not load challenge data', { type: 'error' })
            router.back()
            return
          }

          // Verify this is the right challenge
          if (challenge.id !== challengeId) {
            showToast('Challenge not found or not active', { type: 'error' })
            router.back()
            return
          }

          // Get opponent from challenge
          const challengeOpponentId =
            challenge.challenger_player_id === userData.id
              ? challenge.challenged_player_id
              : challenge.challenger_player_id

          if (!challengeOpponentId) {
            showToast('Could not determine opponent', { type: 'error' })
            router.back()
            return
          }

          // Load opponent data
          const { data: opponentData, error: opponentError } = await getPlayerById(challengeOpponentId)
          if (opponentError || !opponentData) {
            showToast(t('submitResult.couldNotLoadOpponent'), { type: 'error' })
            router.back()
            return
          }
          setOpponent(opponentData)

          // Load league data for match format
          const { data: league } = await supabase
            .from('leagues')
            .select('name, ladder_config, match_format')
            .eq('id', leagueId)
            .single()

          const ladderConfig: LadderConfig = league?.ladder_config || DEFAULT_LADDER_CONFIG
          const matchFormat = ladderConfig.match_format
            || (league?.match_format ? matchFormatToLadderFormat(league.match_format) : DEFAULT_LADDER_MATCH_FORMAT)

          // Set challenge context
          setChallengeContext({
            challengeId,
            leagueId,
            opponentId: challengeOpponentId,
            matchFormat,
            leagueName: league?.name || 'Ladder Competition'
          })

          // Set number of sets based on match format
          setNumberOfSets(matchFormat.number_of_sets as 1 | 3 | 5)

          // Initialize scores for the match format
          setScores(
            Array.from({ length: matchFormat.number_of_sets }, () => ({ player1: 0, player2: 0 }))
          )

          // Set game type to competitive and auto-select the ladder league
          setGameType('competitive')
        }
      } else if (isPlayoff === 'true' && playoffTournamentId && leagueId && opponentId) {
        // Playoff match flow: load opponent and league match format
        const { data: opponentData, error: opponentError } = await getPlayerById(opponentId)
        if (opponentError || !opponentData) {
          showToast(t('submitResult.couldNotLoadOpponent'), { type: 'error' })
          router.back()
          return
        }
        setOpponent(opponentData)

        // Load league data for match format
        const { data: league } = await supabase
          .from('leagues')
          .select('name, match_format')
          .eq('id', leagueId)
          .single()

        const matchFormat: MatchFormat = league?.match_format || DEFAULT_MATCH_FORMAT

        // Set playoff context
        setPlayoffContext({
          playoffTournamentId,
          leagueId,
          opponentId,
          matchFormat,
          leagueName: league?.name || 'Playoff Tournament'
        })

        // Set number of sets based on league match format
        const numSets = matchFormat.number_of_sets as 1 | 2 | 3 | 5
        // Convert 2 sets to 3 for the form (2-set format with tiebreak handled separately)
        setNumberOfSets(numSets === 2 ? 3 : numSets === 5 ? 5 : numSets === 1 ? 1 : 3)

        // Initialize scores for the match format
        setScores(
          Array.from({ length: matchFormat.number_of_sets }, () => ({ player1: 0, player2: 0 }))
        )

        // Set game type to competitive
        setGameType('competitive')
      } else {
        // Regular flow: load opponent from param
        if (!opponentId) {
          showToast(t('submitResult.noOpponentSelected'), { type: 'error' })
          router.back()
          return
        }

        const { data: opponentData, error: opponentError } = await getPlayerById(opponentId)
        if (opponentError || !opponentData) {
          showToast(t('submitResult.couldNotLoadOpponent'), { type: 'error' })
          router.back()
          return
        }
        setOpponent(opponentData)

        // Load player's active competitions
        const { data: competitionsData } = await getPlayerActiveCompetitions(userData.id)
        if (competitionsData) {
          setCompetitions(competitionsData)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showToast(t('submitResult.couldNotLoadData'), { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || matchDate
    setShowDatePicker(Platform.OS === 'ios')
    setMatchDate(currentDate)
  }

  const calculateWinner = () => {
    const setsWonByPlayer1 = scores.filter(set => set.player1 > set.player2).length
    const setsWonByPlayer2 = scores.filter(set => set.player2 > set.player1).length

    // For ladder matches with 2 sets and final set tiebreak
    if (isLadderMatch && challengeContext?.matchFormat) {
      const format = challengeContext.matchFormat

      // If it's a 2-set format with final set tiebreak
      if (format.number_of_sets === 2 && format.final_set_tiebreak) {
        // If one player won both sets
        if (setsWonByPlayer1 === 2) return 'player1'
        if (setsWonByPlayer2 === 2) return 'player2'

        // If tied 1-1, check super tiebreak
        if (setsWonByPlayer1 === 1 && setsWonByPlayer2 === 1) {
          if (showSuperTiebreak && superTiebreakScore.player1 > 0 && superTiebreakScore.player2 > 0) {
            const targetPoints = format.super_tiebreak_points || 10
            if (superTiebreakScore.player1 >= targetPoints && superTiebreakScore.player1 - superTiebreakScore.player2 >= 2) {
              return 'player1'
            }
            if (superTiebreakScore.player2 >= targetPoints && superTiebreakScore.player2 - superTiebreakScore.player1 >= 2) {
              return 'player2'
            }
          }
          return null // Needs super tiebreak
        }
      }
    }

    // Standard calculation for regular matches
    const requiredSetsToWin = Math.ceil(numberOfSets / 2)

    if (setsWonByPlayer1 >= requiredSetsToWin) {
      return 'player1'
    } else if (setsWonByPlayer2 >= requiredSetsToWin) {
      return 'player2'
    }
    return null
  }

  // Check if super tiebreak is required for ladder matches
  const checkSuperTiebreakNeeded = () => {
    if (!isLadderMatch || !challengeContext?.matchFormat) return false

    const format = challengeContext.matchFormat
    if (format.number_of_sets !== 2 || !format.final_set_tiebreak) return false

    const setsWonByPlayer1 = scores.filter(set => set.player1 > set.player2).length
    const setsWonByPlayer2 = scores.filter(set => set.player2 > set.player1).length

    return setsWonByPlayer1 === 1 && setsWonByPlayer2 === 1
  }

  // Update super tiebreak visibility when scores change
  useEffect(() => {
    if (isLadderMatch) {
      setShowSuperTiebreak(checkSuperTiebreakNeeded())
    }
  }, [scores, isLadderMatch])

  const isSetDisabled = (setIndex: number): boolean => {
    const winner = calculateWinner()
    if (!winner) return false

    // Count completed sets (sets with scores for both players)
    const completedSets = scores.filter(set => 
      set.player1 > 0 || set.player2 > 0
    ).length

    // Disable sets after the winner is determined
    return setIndex >= completedSets
  }

  const updateScore = (setIndex: number, player: 'player1' | 'player2', value: string) => {
    // Remove any non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '')
    
    let finalValue = cleanValue
    
    // For all sets except the last one, limit to 1 digit
    if (setIndex !== numberOfSets - 1) {
      // For single-digit inputs, always use the most recent character
      if (cleanValue.length > 0) {
        // If user is typing a new value, just take the last character
        finalValue = cleanValue.charAt(cleanValue.length - 1)
      } else {
        finalValue = ''
      }
    } else {
      // For the last set, allow up to 2 digits
      finalValue = cleanValue.slice(0, 2)
    }
    
    const numValue = finalValue === '' ? 0 : parseInt(finalValue)
    const newScores = [...scores]
    newScores[setIndex] = {
      ...newScores[setIndex],
      [player]: numValue
    }
    setScores(newScores)
    
    // Auto-advance to next input field if valid score entered
    if (finalValue.length > 0 && numValue > 0) {
      const nextInputKey = getNextInputKey(setIndex, player)
      if (nextInputKey && inputRefs[nextInputKey]) {
        setTimeout(() => {
          inputRefs[nextInputKey]?.focus()
        }, 50)
      }
    }
  }
  
  const getNextInputKey = (setIndex: number, player: 'player1' | 'player2'): string | null => {
    // If player1, go to player2 of same set
    if (player === 'player1') {
      return `player2-set-${setIndex}`
    }
    
    // If player2, go to player1 of next set (if not disabled)
    const nextSetIndex = setIndex + 1
    if (nextSetIndex < numberOfSets && !isSetDisabled(nextSetIndex)) {
      return `player1-set-${nextSetIndex}`
    }
    
    return null
  }
  
  const handleInputFocus = (inputKey: string) => {
    setFocusedInput(inputKey)
    
    // Only scroll if we're focusing on a score input
    if (!inputKey.includes('player')) return
    
    // Delay to ensure keyboard is showing
    setTimeout(() => {
      if (scoreViewRef.current && scrollViewRef.current) {
        scoreViewRef.current.measure((fx, fy, width, height, px, py) => {
          // Calculate the position to show the entire score card above the submit button
          // Account for the submit button height (approximately 60px with padding)
          const submitButtonHeight = 60
          const targetY = py - 50 // Position score label 50px from top
          
          // @ts-ignore - scrollToPosition exists on KeyboardAwareScrollView
          scrollViewRef.current?.scrollToPosition(0, targetY, true)
        })
      }
    }, 300) // Wait for keyboard animation
  }

  const validateForm = (): string | null => {
    // For ladder matches, use ladder validation
    if (isLadderMatch && challengeContext?.matchFormat) {
      const format = challengeContext.matchFormat
      const ladderSets: LadderSetScore[] = scores.slice(0, format.number_of_sets)

      // Check if super tiebreak is needed but not provided
      const needsSuperTiebreak = checkSuperTiebreakNeeded()
      const superTiebreakProvided = superTiebreakScore.player1 > 0 || superTiebreakScore.player2 > 0

      const result = validateMatchScore(
        ladderSets,
        format,
        needsSuperTiebreak && superTiebreakProvided ? superTiebreakScore : undefined
      )

      if (!result.valid) {
        if (result.requiresSuperTiebreak && !superTiebreakProvided) {
          return 'Match is tied - please enter the super tiebreak score'
        }
        return result.error || 'Invalid match score'
      }

      return null
    }

    // Check competition selection for competitive matches (non-ladder, non-playoff)
    if (gameType === 'competitive' && !selectedCompetition && !isLadderMatch && !isPlayoffMatch) {
      return t('submitResult.validation.selectCompetition')
    }

    const winner = calculateWinner()
    if (!winner) {
      return t('submitResult.validation.mustHaveWinner')
    }

    // Check completed sets for valid scores
    const completedSets = scores.filter(set => set.player1 > 0 || set.player2 > 0)

    for (let i = 0; i < completedSets.length; i++) {
      const set = completedSets[i]
      const p1Score = set.player1
      const p2Score = set.player2

      if (p1Score === 0 && p2Score === 0) {
        return t('submitResult.validation.enterScoresForSet', { number: i + 1 })
      }

      if (p1Score === p2Score) {
        return t('submitResult.validation.cannotEndInTie', { number: i + 1 })
      }

      const higherScore = Math.max(p1Score, p2Score)
      const lowerScore = Math.min(p1Score, p2Score)

      // Check if it's the last set (potential tiebreak set)
      const isLastSet = i === numberOfSets - 1

      if (isLastSet && higherScore > 6) {
        // Last set can be a tiebreak (e.g., 7-6) or extended game (e.g., 13-11)
        if (higherScore === 7 && lowerScore === 6) {
          // Valid tiebreak score
          continue
        }
        // For extended games, must win by 2
        if (higherScore - lowerScore !== 2) {
          return t('submitResult.validation.winByTwoGames', { number: i + 1 })
        }
      } else {
        // Regular set validation
        if (higherScore < 6) {
          return t('submitResult.validation.mustWinWithSix', { number: i + 1 })
        }

        if (higherScore === 6) {
          // Can win 6-0, 6-1, 6-2, 6-3, or 6-4
          if (lowerScore > 4) {
            return t('submitResult.validation.invalidScoreSix', { number: i + 1 })
          }
        } else if (higherScore === 7) {
          // Can only be 7-5 or 7-6 (tiebreak)
          if (lowerScore !== 5 && lowerScore !== 6) {
            return t('submitResult.validation.sevenGamesRule', { number: i + 1 })
          }
        } else {
          // Higher than 7 is invalid for non-final sets
          return t('submitResult.validation.invalidScoreExceedSeven', { number: i + 1 })
        }
      }
    }

    return null
  }

  const handleSubmit = async () => {
    if (!currentPlayer || !opponent) return

    // Prevent double submission
    if (submitting) return

    const validationError = validateForm()
    if (validationError) {
      showToast(validationError, { type: 'error' })
      return
    }

    setSubmitting(true)
    showToast(isEditMode ? t('submitResult.updatingResult') : t('submitResult.submittingResult'), { type: 'info' })

    try {
      // Determine winner ID
      const winner = calculateWinner()
      const winnerId = winner === 'player1' ? currentPlayer.id : opponent.id

      // Build scores array, including super tiebreak if needed for ladder
      let finalScores = scores.slice(0, numberOfSets)

      // For ladder matches, add super tiebreak as a third "set" if applicable
      if (isLadderMatch && showSuperTiebreak && (superTiebreakScore.player1 > 0 || superTiebreakScore.player2 > 0)) {
        finalScores = [...finalScores, superTiebreakScore]
      }

      // Edit mode: update existing match
      if (isEditMode && editMatchIdState && challengeContext) {
        const { error: editError } = await editLadderMatchResult(
          editMatchIdState,
          challengeContext.challengeId,
          finalScores,
          winnerId
        )

        if (editError) {
          showToast(editError.message || t('alerts.submitError'), { type: 'error' })
          setSubmitting(false)
          return
        }

        // Invalidate ladder-specific queries
        queryClient.invalidateQueries({ queryKey: ['ladder-rankings', challengeContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['active-challenge', challengeContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['challenge-history', challengeContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['position-history'] })
        queryClient.invalidateQueries({ queryKey: ['player-matches'] })
        queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })

        showToast(t('submitResult.resultUpdated'), { type: 'success' })
        router.back()
        return
      }

      // New match submission
      const matchData: SubmitMatchData = {
        player1Id: currentPlayer.id,
        player2Id: opponent.id,
        matchDate: matchDate.toISOString(),
        numberOfSets: isLadderMatch && showSuperTiebreak ? (numberOfSets + 1) as 1 | 3 | 5 : numberOfSets,
        gameType: isLadderMatch || isPlayoffMatch ? 'competitive' : gameType,
        matchType,
        scores: finalScores,
        leagueId: challengeContext?.leagueId || playoffContext?.leagueId || selectedCompetition?.leagueId || undefined,
        competitionType: isLadderMatch ? 'league' : isPlayoffMatch ? 'playoff' : selectedCompetition?.type,
        playoffTournamentId: playoffContext?.playoffTournamentId || selectedCompetition?.playoffTournamentId
      }

      const { data: matchResult, error } = await submitMatchResult(matchData, currentPlayer.id)

      if (error) {
        showToast(t('alerts.submitError'), { type: 'error' })
        setSubmitting(false)
        return
      }

      // If this is a ladder challenge, complete the challenge
      if (isLadderMatch && challengeContext) {
        const { error: challengeError } = await completeChallenge(
          challengeContext.challengeId,
          matchResult?.id || '',
          winnerId
        )

        if (challengeError) {
          console.error('Error completing challenge:', challengeError)
          // Match was submitted, but challenge completion failed
          // Show warning but don't fail the entire operation
          showToast('Match recorded, but challenge update failed. Please contact support.', { type: 'warning' })
        }

        // Invalidate ladder-specific queries
        queryClient.invalidateQueries({ queryKey: ['ladder-rankings', challengeContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['active-challenge', challengeContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['pending-challenges'] })
        queryClient.invalidateQueries({ queryKey: ['challenge-history', challengeContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['position-history'] })
      }

      // If this is a playoff match, invalidate playoff-related queries
      if (isPlayoffMatch && playoffContext) {
        queryClient.invalidateQueries({ queryKey: ['playoff-tournament', playoffContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['playoff-tournament-full', playoffContext.leagueId] })
        queryClient.invalidateQueries({ queryKey: ['qualifying-players', playoffContext.leagueId] })
      }

      // Invalidate queries to refresh league standings and other related data
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      queryClient.invalidateQueries({ queryKey: ['league-standings'] })
      queryClient.invalidateQueries({ queryKey: ['player-stats'] })

      // Also invalidate player matches and profile data to ensure everything refreshes
      queryClient.invalidateQueries({ queryKey: ['player-matches'] })
      queryClient.invalidateQueries({ queryKey: ['player-profile'] })

      // Show celebration screen instead of toast + navigate
      setCelebrationData({
        isWinner: winnerId === currentPlayer.id,
        scores: finalScores,
        matchDate: matchDate,
        competitionName: challengeContext?.leagueName || playoffContext?.leagueName || selectedCompetition?.name
      })
      setShowCelebration(true)
    } catch (error) {
      console.error('Error submitting match:', error)
      showToast(t('alerts.submitError'), { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScreenHeader title={t('submitResult.title')} onBack={handleBack} />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontSize: 16, marginTop: 16, color: colors.foreground }}>
              {t('submitResult.loading')}
            </Text>
          </View>
        </SafeAreaView>
      </>
    )
  }

  if (!opponent || !currentPlayer) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScreenHeader title={t('submitResult.title')} onBack={handleBack} />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: colors.mutedForeground }}>
              {t('submitResult.errorLoadingData')}
            </Text>
          </View>
        </SafeAreaView>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
        <ScreenHeader title={isEditMode ? t('submitResult.editTitle') : t('submitResult.title')} onBack={handleBack} />

        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={{ flex: 1 }}>
            <KeyboardAwareScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
              enableOnAndroid={true}
              enableAutomaticScroll={false}
              viewIsInsideTabBar={false}
              enableResetScrollToCoords={false}
            >
          {/* Match Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.foreground,
              textAlign: 'center'
            }}>
              {t('submitResult.matchVs', { name: `${opponent.first_name} ${opponent.last_name}` })}
            </Text>
          </View>

          {/* Ladder Challenge Info Banner */}
          {isLadderMatch && challengeContext && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <View style={{
                backgroundColor: isEditMode ? '#fef3c7' : colors.card,
                borderWidth: 1,
                borderColor: isEditMode ? '#f59e0b' : colors.border,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <Info size={18} color={isEditMode ? '#d97706' : colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isEditMode ? '#92400e' : colors.foreground,
                    marginBottom: 4
                  }}>
                    {isEditMode ? t('submitResult.editingResult') : 'Ladder Challenge Match'}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.mutedForeground,
                    marginBottom: 4
                  }}>
                    {challengeContext.leagueName}
                  </Text>
                  {isEditMode && (
                    <Text style={{
                      fontSize: 12,
                      color: '#92400e',
                      marginBottom: 4
                    }}>
                      {t('submitResult.editWarning')}
                    </Text>
                  )}
                  <Text style={{
                    fontSize: 12,
                    color: colors.mutedForeground
                  }}>
                    Format: {getMatchFormatDescription(challengeContext.matchFormat)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Playoff Match Info Banner */}
          {isPlayoffMatch && playoffContext && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <View style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.foreground,
                    marginBottom: 4
                  }}>
                    {playoffContext.leagueName}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.mutedForeground
                  }}>
                    Format: Best of {playoffContext.matchFormat.number_of_sets} {playoffContext.matchFormat.number_of_sets === 1 ? 'Set' : 'Sets'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Date and Time */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12
            }}>
              {t('submitResult.dateAndTime')}
            </Text>
            {/* Only show the button when picker is not visible (iOS shows inline picker) */}
            {!(showDatePicker && Platform.OS === 'ios') && (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 16 }}>
                  {matchDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={matchDate}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Number of Sets - Hidden for ladder matches and playoff matches */}
          {!isLadderMatch && !isPlayoffMatch && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12
              }}>
                {t('submitResult.numberOfSets')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 3, 5].map((sets) => (
                  <TouchableOpacity
                    key={sets}
                    onPress={() => setNumberOfSets(sets as 1 | 3 | 5)}
                    style={{
                      flex: 1,
                      backgroundColor: numberOfSets === sets ? colors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: numberOfSets === sets ? colors.primary : colors.border,
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: numberOfSets === sets ? colors.primaryForeground : colors.foreground,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {t(sets > 1 ? 'submitResult.sets_plural' : 'submitResult.sets', { count: sets })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Game Type - Hidden for ladder matches and playoff matches */}
          {!isLadderMatch && !isPlayoffMatch && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12
              }}>
                {t('submitResult.typeOfGame')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { key: 'competitive', labelKey: 'submitResult.competitive' },
                  { key: 'practice', labelKey: 'submitResult.practice' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    onPress={() => setGameType(type.key as 'practice' | 'competitive')}
                    style={{
                      flex: 1,
                      backgroundColor: gameType === type.key ? colors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: gameType === type.key ? colors.primary : colors.border,
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: gameType === type.key ? colors.primaryForeground : colors.foreground,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {t(type.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Competition Selection (if competitive and not ladder/playoff match) */}
          {!isLadderMatch && !isPlayoffMatch && gameType === 'competitive' && competitions.length > 0 && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12
              }}>
                {t('submitResult.competition')}
              </Text>
              <View style={{ gap: 8 }}>
                {competitions.map((competition) => {
                  const isActive = competition.status === 'active' || competition.status === 'in_progress'
                  const isSelected = selectedCompetition?.id === competition.id

                  let statusText = ''
                  let statusColor = colors.mutedForeground

                  switch (competition.status) {
                    case 'active':
                      statusText = t('submitResult.status.active')
                      statusColor = colors.success || colors.primary
                      break
                    case 'in_progress':
                      statusText = t('submitResult.status.inProgress')
                      statusColor = colors.primary
                      break
                    case 'upcoming':
                      statusText = t('submitResult.status.upcoming')
                      statusColor = colors.mutedForeground
                      break
                    case 'ended':
                      statusText = t('submitResult.status.ended')
                      statusColor = colors.mutedForeground
                      break
                  }

                  const competitionTypeLabel = competition.type === 'league' ? t('submitResult.competitionTypes.league') :
                                              competition.type === 'playoff' ? t('submitResult.competitionTypes.playoff') :
                                              t('submitResult.competitionTypes.championship')
                  
                  return (
                    <TouchableOpacity
                      key={competition.id}
                      onPress={() => isActive ? setSelectedCompetition(competition) : null}
                      style={{
                        backgroundColor: isSelected ? colors.primary : 
                                       isActive ? colors.card : colors.muted,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: 8,
                        padding: 12,
                        opacity: isActive ? 1 : 0.6
                      }}
                      disabled={!isActive}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ 
                            color: isSelected ? colors.primaryForeground : 
                                   isActive ? colors.foreground : colors.mutedForeground,
                            fontSize: 14,
                            fontWeight: '600'
                          }}>
                            {competition.name}
                          </Text>
                          <Text style={{ 
                            color: isSelected ? colors.primaryForeground : colors.mutedForeground,
                            fontSize: 12,
                            marginTop: 2
                          }}>
                            {competitionTypeLabel}
                          </Text>
                        </View>
                        <View style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                          backgroundColor: isSelected ? colors.primaryForeground + '20' : colors.muted
                        }}>
                          <Text style={{ 
                            color: isSelected ? colors.primaryForeground : statusColor,
                            fontSize: 11,
                            fontWeight: '600'
                          }}>
                            {statusText}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
                
                {/* Show championship as disabled */}
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    opacity: 0.5
                  }}
                  disabled={true}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: colors.mutedForeground,
                        fontSize: 14,
                        fontWeight: '600'
                      }}>
                        {t('submitResult.competitionTypes.championship')}
                      </Text>
                      <Text style={{
                        color: colors.mutedForeground,
                        fontSize: 12,
                        marginTop: 2
                      }}>
                        {t('submitResult.comingSoon')}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: colors.muted
                    }}>
                      <Text style={{
                        color: colors.mutedForeground,
                        fontSize: 11,
                        fontWeight: '600'
                      }}>
                        {t('submitResult.notAvailable')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Match Type - hidden for competition matches (type defined by competition) */}
          {!isLadderMatch && !isPlayoffMatch && !selectedCompetition && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12
              }}>
                {t('submitResult.typeOfMatch')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setMatchType('singles')}
                  style={{
                    flex: 1,
                    backgroundColor: matchType === 'singles' ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: matchType === 'singles' ? colors.primary : colors.border,
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: matchType === 'singles' ? colors.primaryForeground : colors.foreground,
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    {t('submitResult.singles')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: colors.mutedForeground,
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    {t('submitResult.doublesSoon')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Score Input */}
          <View ref={scoreViewRef} style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12
            }}>
              {t('submitResult.score')}
            </Text>
            
            <View style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 16
            }}>
              {/* Player 1 Row */}
              <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: 16,
                  gap: 8
                }}>
                  <Text style={{ fontSize: 18 }}>
                    {getFlagEmoji(currentPlayer.nationality_code || '')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ 
                      color: colors.foreground, 
                      fontSize: 14, 
                      fontWeight: '500'
                    }}>
                      {currentPlayer.first_name} {currentPlayer.last_name?.charAt(0)}.
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                  {Array.from({ length: numberOfSets }, (_, index) => {
                    const setDisabled = isSetDisabled(index)
                    const inputKey = `player1-set-${index}`
                    const isFocused = focusedInput === inputKey
                    return (
                      <TextInput
                        key={inputKey}
                        ref={(ref) => { inputRefs[inputKey] = ref }}
                        value={scores[index]?.player1 === 0 ? '' : scores[index]?.player1?.toString()}
                        onChangeText={(value) => updateScore(index, 'player1', value)}
                        onFocus={() => handleInputFocus(inputKey)}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.mutedForeground}
                        editable={!setDisabled}
                        style={{
                          backgroundColor: setDisabled ? colors.border : colors.muted,
                          borderRadius: 8,
                          width: 36,
                          height: 36,
                          textAlign: 'center',
                          color: setDisabled ? colors.mutedForeground : colors.foreground,
                          fontSize: 16,
                          fontWeight: '700',
                          opacity: setDisabled ? 0.5 : 1,
                          borderWidth: 1,
                          borderColor: isFocused ? colors.primary : colors.border
                        }}
                      />
                    )
                  })}
                </View>
              </View>

              {/* Player 2 Row */}
              <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Text style={{ fontSize: 18 }}>
                    {getFlagEmoji(opponent.nationality_code || '')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{
                      color: colors.foreground,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {opponent.first_name} {opponent.last_name?.charAt(0)}.
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                  {Array.from({ length: numberOfSets }, (_, index) => {
                    const setDisabled = isSetDisabled(index)
                    const inputKey = `player2-set-${index}`
                    const isFocused = focusedInput === inputKey
                    return (
                      <TextInput
                        key={inputKey}
                        ref={(ref) => { inputRefs[inputKey] = ref }}
                        value={scores[index]?.player2 === 0 ? '' : scores[index]?.player2?.toString()}
                        onChangeText={(value) => updateScore(index, 'player2', value)}
                        onFocus={() => handleInputFocus(inputKey)}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.mutedForeground}
                        editable={!setDisabled}
                        style={{
                          backgroundColor: setDisabled ? colors.border : colors.muted,
                          borderRadius: 8,
                          width: 36,
                          height: 36,
                          textAlign: 'center',
                          color: setDisabled ? colors.mutedForeground : colors.foreground,
                          fontSize: 16,
                          fontWeight: '700',
                          opacity: setDisabled ? 0.5 : 1,
                          borderWidth: 1,
                          borderColor: isFocused ? colors.primary : colors.border
                        }}
                      />
                    )
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Super Tiebreak Input - For ladder matches when sets are tied */}
          {isLadderMatch && showSuperTiebreak && challengeContext?.matchFormat && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 4
              }}>
                Super Tiebreak
              </Text>
              <Text style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginBottom: 12
              }}>
                First to {challengeContext.matchFormat.super_tiebreak_points || 10} points, win by 2
              </Text>

              <View style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.primary + '50',
                borderRadius: 8,
                padding: 16
              }}>
                {/* Player 1 Tiebreak Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                  gap: 8
                }}>
                  <Text style={{ fontSize: 18 }}>
                    {getFlagEmoji(currentPlayer?.nationality_code || '')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{
                      color: colors.foreground,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {currentPlayer?.first_name} {currentPlayer?.last_name?.charAt(0)}.
                    </Text>
                  </View>
                  <TextInput
                    value={superTiebreakScore.player1 === 0 ? '' : superTiebreakScore.player1.toString()}
                    onChangeText={(value) => {
                      const numValue = value === '' ? 0 : parseInt(value.replace(/[^0-9]/g, ''))
                      setSuperTiebreakScore(prev => ({ ...prev, player1: numValue }))
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={2}
                    selectTextOnFocus={true}
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: 8,
                      width: 48,
                      height: 36,
                      textAlign: 'center',
                      color: colors.foreground,
                      fontSize: 16,
                      fontWeight: '700',
                      borderWidth: 1,
                      borderColor: colors.border
                    }}
                  />
                </View>

                {/* Player 2 Tiebreak Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Text style={{ fontSize: 18 }}>
                    {getFlagEmoji(opponent?.nationality_code || '')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{
                      color: colors.foreground,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {opponent?.first_name} {opponent?.last_name?.charAt(0)}.
                    </Text>
                  </View>
                  <TextInput
                    value={superTiebreakScore.player2 === 0 ? '' : superTiebreakScore.player2.toString()}
                    onChangeText={(value) => {
                      const numValue = value === '' ? 0 : parseInt(value.replace(/[^0-9]/g, ''))
                      setSuperTiebreakScore(prev => ({ ...prev, player2: numValue }))
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={2}
                    selectTextOnFocus={true}
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: 8,
                      width: 48,
                      height: 36,
                      textAlign: 'center',
                      color: colors.foreground,
                      fontSize: 16,
                      fontWeight: '700',
                      borderWidth: 1,
                      borderColor: colors.border
                    }}
                  />
                </View>
              </View>
            </View>
          )}
            </KeyboardAwareScrollView>

            {/* Submit Button - Outside ScrollView */}
            <View style={{ 
              paddingHorizontal: 24, 
              paddingBottom: keyboardVisible ? 8 : 32,
              paddingTop: 4
            }}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={{
                  backgroundColor: submitting ? colors.muted : colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: submitting ? 0.7 : 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
                activeOpacity={submitting ? 1 : 0.8}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                    <Text style={{
                      color: colors.mutedForeground,
                      fontSize: 14,
                      fontWeight: '600'
                    }}>
                      {t('submitResult.submitting')}
                    </Text>
                  </>
                ) : (
                  <Text style={{
                    color: colors.primaryForeground,
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    {isEditMode ? t('submitResult.updateResult') : t('submitResult.submit')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Celebration Screen */}
        {showCelebration && celebrationData && currentPlayer && opponent && (
          <MatchResultScreen
            visible={showCelebration}
            isWinner={celebrationData.isWinner}
            currentPlayer={currentPlayer}
            opponent={opponent}
            scores={celebrationData.scores}
            matchDate={celebrationData.matchDate}
            competitionName={celebrationData.competitionName}
            onClose={() => {
              setShowCelebration(false)
              router.back()
            }}
          />
        )}
      </SafeAreaView>
    </>
  )
} 