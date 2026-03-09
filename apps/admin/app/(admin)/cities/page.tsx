import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CitiesPageContent } from "@/components/cities/cities-page-content"

interface City {
  id: string
  name: string
  state_province?: string
  country_code: string
  country_name: string
  latitude?: number
  longitude?: number
  is_active?: boolean
  player_count?: number
  created_at: string
  updated_at: string
}

async function getCities() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching cities:', error.message || 'Unknown error', error)
      return []
    }

    return cities || []
  } catch (error) {
    console.error('Error in getCities:', error)
    return []
  }
}

export default async function CitiesPage() {
  const cities = await getCities() as City[]
  const activeCities = cities.filter(c => c.is_active !== false)
  const uniqueCountries = new Set(cities.filter(c => c.is_active !== false).map(c => c.country_name)).size
  const totalPlayers = cities.reduce((sum, c) => sum + (c.player_count || 0), 0)
  const inactiveCount = cities.filter(c => c.is_active === false).length

  const initialStats = {
    totalCities: activeCities.length,
    countries: uniqueCountries,
    totalPlayers,
    inactive: inactiveCount,
  }

  return <CitiesPageContent cities={cities} initialStats={initialStats} />
}
