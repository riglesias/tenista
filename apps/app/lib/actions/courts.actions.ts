import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

type Court = Database['public']['Tables']['courts']['Row']

export async function getCourtsByCity(cityId: string) {
  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('city_id', cityId)
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

export async function getCourtById(courtId: string) {
  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

export async function getAllCourts() {
  try {
    const { data, error } = await supabase
      .from('courts')
      .select(`
        *,
        cities (
          name,
          state_province,
          country_code,
          country_name
        )
      `)
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
} 