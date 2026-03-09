import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AvailabilityData, TimeSlot } from '@/lib/database.types'

export type DayOption = 'all' | 'today' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

type Player = {
  id: string
  first_name: string | null
  last_name: string | null
  rating: number | null
  avatar_url: string | null
  homecourt_name: string | null
  city_name: string | null
  state_province: string | null
  availability: AvailabilityData | null
  country_code: string | null // Location country
  nationality_code: string | null // Flag nationality
}

const DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_KEYS: DayOption[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function usePlayerFiltering(allPlayers: Player[]) {
  const { t } = useTranslation('common')
  const [selectedDay, setSelectedDay] = useState<DayOption>('today')
  const [ratingRange, setRatingRange] = useState<[number, number]>([1, 5])

  // Generate day options starting from today
  const dayOptions = useMemo(() => {
    const today = new Date().getDay()
    const options: { key: DayOption; label: string; isSeparator?: boolean }[] = []

    // Add "All" button and separator at the beginning
    options.push({ key: 'all', label: t('days.all') })
    options.push({ key: 'all' as DayOption, label: '|', isSeparator: true })

    // Add all 7 days starting from today
    for (let i = 0; i < 7; i++) {
      const dayIndex = (today + i) % 7
      const dayKey = DAY_KEYS[dayIndex]
      const isToday = i === 0

      options.push({
        key: isToday ? 'today' : dayKey,
        label: isToday ? t('days.today') : t(`days.${dayKey}`)
      })
    }

    return options
  }, [t])

  // Filter players by day and rating
  const filteredPlayers = useMemo(() => {
    let filteredByDay = allPlayers

    // Filter by day
    if (selectedDay !== 'all') {
      let dayKey: string
      if (selectedDay === 'today') {
        const today = new Date().getDay()
        dayKey = DAY_MAP[today]
      } else {
        // Convert day option to day key
        const dayIndex = DAY_KEYS.findIndex(d => d === selectedDay)
        dayKey = DAY_MAP[dayIndex]
      }

      filteredByDay = allPlayers.filter(player => {
        const availability = player.availability?.[dayKey as keyof AvailabilityData]
        return availability && availability.length > 0
      })
    }

    // Filter by rating range
    const finalFiltered = filteredByDay.filter(player => {
      const rating = player.rating || 1 // Default to 1.0 for players without rating
      return rating >= ratingRange[0] && rating <= ratingRange[1]
    })

    return finalFiltered
  }, [allPlayers, selectedDay, ratingRange])

  // Get player availability for display
  const getPlayerAvailability = (availability: AvailabilityData | null): TimeSlot[] => {
    if (!availability) return []

    if (selectedDay === 'all') {
      // Show all available time slots across all days
      const allSlots = new Set<TimeSlot>()
      Object.values(availability).forEach((slots: any) => {
        if (Array.isArray(slots)) {
          slots.forEach(slot => allSlots.add(slot))
        }
      })
      return Array.from(allSlots)
    }

    let dayKey: string
    if (selectedDay === 'today') {
      const today = new Date().getDay()
      dayKey = DAY_MAP[today]
    } else {
      const dayIndex = DAY_KEYS.findIndex(d => d === selectedDay)
      dayKey = DAY_MAP[dayIndex]
    }

    return availability[dayKey as keyof AvailabilityData] || []
  }

  const clearFilters = () => {
    setSelectedDay('today')
    setRatingRange([1, 5])
  }

  const hasActiveFilters = selectedDay !== 'today' || ratingRange[0] !== 1 || ratingRange[1] !== 5

  return {
    // State
    selectedDay,
    ratingRange,
    
    // Setters
    setSelectedDay,
    setRatingRange,
    
    // Computed values
    filteredPlayers,
    dayOptions,
    hasActiveFilters,
    
    // Utilities
    getPlayerAvailability,
    clearFilters,
  }
}