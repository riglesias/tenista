import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { getPlayerById, getPlayerProfile } from '@/lib/actions/player.actions'
import { getPlayerLeagues } from '@/lib/actions/matches.actions'
import { useErrorHandler } from '@/lib/utils/errors'
import { useAppToast } from '@/components/ui/Toast'

export interface PlayerData {
  id: string
  first_name: string | null
  last_name: string | null
  country_code: string | null
  nationality_code: string | null
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
  const { showToast } = useAppToast()

  useEffect(() => {
    if (opponentId) {
      loadData()
    }
  }, [opponentId])

  const loadData = async () => {
    if (!opponentId) {
      showToast('No opponent selected', { type: 'error' })
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
      showToast(error.message, { type: 'error' })
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