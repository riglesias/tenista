import { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

type City = Database['public']['Tables']['cities']['Row']

export async function getCitiesByCountry(countryCode: string) {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

export async function getAllCountriesWithCities() {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('country_code, country_name')
      .eq('is_active', true)
    
    if (error) throw error
    
    // Get unique countries
    const uniqueCountries = Array.from(
      new Map(data.map(item => [item.country_code, item])).values()
    )
    
    return { data: uniqueCountries, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

export async function getCityById(cityId: string) {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

export async function getAllCities() {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('country_name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // silently handled
    return { data: null, error }
  }
}

// Function to infer user's country based on timezone or other factors
export async function inferUserCountry(): Promise<string> {
  try {
    // Method 1: Try to get country from IP using a free API
    // Note: This won't work in development/localhost
    const response = await fetch('https://ipapi.co/json/')
    
    if (response.ok) {
      const data = await response.json()
      if (data.country_code) {
        return data.country_code
      }
    }
  } catch (error) {
    // silently handled
  }
  
  // Method 2: Use timezone as fallback
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Map common timezones to countries
    const timezoneToCountry: { [key: string]: string } = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Los_Angeles': 'US',
      'America/Phoenix': 'US',
      'America/Denver': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Singapore': 'SG',
    }
    
    // Check if timezone starts with any of our mapped values
    for (const [tz, country] of Object.entries(timezoneToCountry)) {
      if (timezone.includes(tz.split('/')[1])) {
        return country
      }
    }
  } catch (error) {
    // silently handled
  }
  
  // Default to US if we can't determine
  return 'US'
} 