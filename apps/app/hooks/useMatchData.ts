import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { getPlayerById, getPlayerProfile } from '@/lib/actions/player.actions'
import { getPlayerLeagues } from '@/lib/actions/matches.actions'
import { useErrorHandler } from '@/lib/utils/errors'

export interface PlayerData {
  id: string
  first_name: string | null
  last_name: string | null
  country_code: string | null
  rating: number | null
}

export interface League {
  id: string
  name: string
  division: string | null
  city_id: string | null
  is_active: boolean | null
}

export function useMatchData(opponentId?: string) {
  const [loading, setLoading] = useState(true)
  const [opponent, setOpponent] = useState<PlayerData | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null)
  const [leagues, setLeagues] = useState<League[]>([])
  const { handleAsyncError } = useErrorHandler()

  useEffect(() => {
    if (opponentId) {
      loadData()
    }
  }, [opponentId])

  const loadData = async () => {
    if (!opponentId) {
      Alert.alert('Error', 'No opponent selected')
      router.back()
      return
    }

    setLoading(true)

    const { error } = await handleAsyncError(
      async () => {
        // Load opponent data
        const { data: opponentData, error: opponentError } = await getPlayerById(opponentId)
        if (opponentError || !opponentData) {
          throw new Error('Could not load opponent data')
        }
        setOpponent(opponentData)

        // Load current player data
        const { data: userData } = await getPlayerProfile('')
        if (!userData) {
          throw new Error('Could not load current player data')
        }
        setCurrentPlayer(userData)
        
        // Load player's leagues
        const { data: leaguesData } = await getPlayerLeagues(userData.id)
        if (leaguesData) {
          setLeagues(leaguesData as League[])
        }
      },
      'loadMatchData'
    )

    if (error) {
      Alert.alert('Error', error.message)
      router.back()
    } else {
      setLoading(false)
    }
  }

  const refetch = () => {
    loadData()
  }

  return {
    loading,
    opponent,
    currentPlayer,
    leagues,
    refetch,
    hasData: !loading && opponent && currentPlayer,
  }
}