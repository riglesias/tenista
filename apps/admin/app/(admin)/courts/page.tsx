import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CourtsPageContent } from "@/components/courts/courts-page-content"

interface Court {
  id: string
  name: string
  city_id: string
  city_name?: string
  address: string | null
  court_type: string | null
  surface_type: string | null
  number_of_courts: number | null
  has_lights: boolean | null
  is_public: boolean | null
  contact_info: any
  amenities: string[] | null
  operating_hours: any
  pricing: any
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

async function getCourts() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: courts, error } = await supabase
      .from('courts')
      .select(`
        *,
        city:city_id (
          id,
          name
        )
      `)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching courts:', error.message || 'Unknown error', error)
      return []
    }

    // Transform the data to include city_name at the top level
    const courtsWithCity = courts?.map(court => ({
      ...court,
      city_name: court.city?.name || 'Unknown'
    })) || []

    return courtsWithCity
  } catch (error) {
    console.error('Error in getCourts:', error)
    return []
  }
}

export default async function CourtsPage() {
  const courts = await getCourts()
  const activeCourts = courts.filter(c => c.is_active)
  const publicCourts = courts.filter(c => c.is_public)
  const privateCourts = courts.filter(c => !c.is_public)
  const lightsCount = courts.filter(c => c.has_lights).length

  const initialStats = {
    total: activeCourts.length,
    publicCourts: publicCourts.length,
    privateCourts: privateCourts.length,
    withLights: lightsCount
  }

  return <CourtsPageContent courts={courts} initialStats={initialStats} />
}