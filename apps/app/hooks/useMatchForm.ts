import { useState, useEffect } from 'react'

export interface SetScore {
  player1: number
  player2: number
}

export type GameType = 'practice' | 'competitive'
export type MatchType = 'singles' | 'doubles'
export type NumberOfSets = 1 | 3 | 5

interface UseMatchFormOptions {
  initialNumberOfSets?: NumberOfSets
  initialGameType?: GameType
  initialMatchType?: MatchType
}

export function useMatchForm(options: UseMatchFormOptions = {}) {
  const {
    initialNumberOfSets = 3,
    initialGameType = 'competitive',
    initialMatchType = 'singles'
  } = options

  // Form state
  const [matchDate, setMatchDate] = useState(new Date())
  const [numberOfSets, setNumberOfSets] = useState<NumberOfSets>(initialNumberOfSets)
  const [gameType, setGameType] = useState<GameType>(initialGameType)
  const [matchType, setMatchType] = useState<MatchType>(initialMatchType)
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)
  const [scores, setScores] = useState<SetScore[]>([
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 }
  ])

  // Update scores array when number of sets changes
  useEffect(() => {
    const newScores = Array.from({ length: numberOfSets }, (_, index) => 
      scores[index] || { player1: 0, player2: 0 }
    )
    setScores(newScores)
  }, [numberOfSets])

  // Score calculation logic
  const calculateWinner = (): 'player1' | 'player2' | null => {
    const setsWonByPlayer1 = scores.filter(set => set.player1 > set.player2).length
    const setsWonByPlayer2 = scores.filter(set => set.player2 > set.player1).length
    
    const requiredSetsToWin = Math.ceil(numberOfSets / 2)
    
    if (setsWonByPlayer1 >= requiredSetsToWin) {
      return 'player1'
    } else if (setsWonByPlayer2 >= requiredSetsToWin) {
      return 'player2'
    }
    return null
  }

  const isSetDisabled = (setIndex: number): boolean => {
    const winner = calculateWinner()
    if (!winner) return false

    // Count completed sets (sets with scores for both players)
    const completedSets = scores.filter(set => 
      set.player1 > 0 || set.player2 > 0
    ).length

    // Disable sets beyond the minimum required to determine winner
    const requiredSetsToWin = Math.ceil(numberOfSets / 2)
    return setIndex >= completedSets && completedSets >= requiredSetsToWin
  }

  const updateScore = (setIndex: number, player: 'player1' | 'player2', value: number) => {
    if (value < 0) return // Prevent negative scores
    
    setScores(prevScores => {
      const newScores = [...prevScores]
      newScores[setIndex] = {
        ...newScores[setIndex],
        [player]: value
      }
      return newScores
    })
  }

  // Validation
  const isFormValid = (): boolean => {
    // Check if at least one set has scores
    const hasValidScores = scores.some(set => set.player1 > 0 || set.player2 > 0)
    
    // Check if we have a winner
    const winner = calculateWinner()
    
    // For competitive matches, must have a league selected
    const hasLeagueIfCompetitive = gameType === 'practice' || selectedLeague !== null

    return hasValidScores && winner !== null && hasLeagueIfCompetitive
  }

  const getMatchSummary = () => {
    const winner = calculateWinner()
    const totalSets = scores.filter(set => set.player1 > 0 || set.player2 > 0).length
    
    return {
      winner,
      totalSets,
      isPlayer1Winner: winner === 'player1',
      isPlayer2Winner: winner === 'player2',
      setsWonByPlayer1: scores.filter(set => set.player1 > set.player2).length,
      setsWonByPlayer2: scores.filter(set => set.player2 > set.player1).length,
    }
  }

  const resetForm = () => {
    setMatchDate(new Date())
    setNumberOfSets(initialNumberOfSets)
    setGameType(initialGameType)
    setMatchType(initialMatchType)
    setSelectedLeague(null)
    setScores([
      { player1: 0, player2: 0 },
      { player1: 0, player2: 0 },
      { player1: 0, player2: 0 }
    ])
  }

  return {
    // State
    matchDate,
    numberOfSets,
    gameType,
    matchType,
    selectedLeague,
    scores,
    
    // Setters
    setMatchDate,
    setNumberOfSets,
    setGameType,
    setMatchType,
    setSelectedLeague,
    updateScore,
    
    // Computed values
    winner: calculateWinner(),
    isFormValid: isFormValid(),
    matchSummary: getMatchSummary(),
    
    // Utilities
    isSetDisabled,
    resetForm,
  }
}