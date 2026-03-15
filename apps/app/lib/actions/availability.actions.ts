import { AvailabilityData, DayOfWeek } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { isFromToday } from './daily-availability.actions';

const DAY_MAP: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Helper function to check if a player is available today
function isAvailableToday(availableToday: boolean | null, updatedAt: string | null): boolean {
  if (!availableToday || !updatedAt) return false;
  return isFromToday(updatedAt);
}

export async function getAvailablePlayersToday(
  userId: string,
  userCityId: string,
  userAvailability: AvailabilityData
) {
  try {
    // Get current day of week
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayKey = DAY_MAP[today];
    
    // Get user's time slots for today
    const userTodaySlots = userAvailability[todayKey] || [];
    
    if (userTodaySlots.length === 0) {
      // User has no availability today
      return { data: [], error: null };
    }

    // Query players in the same city with homecourt information
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        *,
        availability,
        courts!homecourt_id (
          name
        )
      `)
      .eq('city_id', userCityId)
      .eq('is_active', true) // Only include active players
      .neq('auth_user_id', userId) // Exclude current user
      .not('availability', 'is', null);

    if (error) throw error;

    // Transform the data to include homecourt_name at the top level
    const transformedPlayers = players?.map(player => ({
      ...player,
      homecourt_name: player.courts?.name || null
    })) || [];

    // Filter players who have at least one matching time slot today
    const availablePlayers = transformedPlayers.filter(player => {
      if (!player.availability) return false;
      
      const playerAvailability = player.availability as AvailabilityData;
      const playerTodaySlots = playerAvailability[todayKey] || [];
      
      // Check if there's any overlap in time slots
      return playerTodaySlots.some(slot => userTodaySlots.includes(slot));
    });

    // Sort by rating (highest first) or any other criteria
    availablePlayers.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return { data: availablePlayers, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Helper function to get available players for any specific day
export async function getAvailablePlayersForDay(
  userId: string,
  userCityId: string,
  userAvailability: AvailabilityData,
  dayOfWeek: DayOfWeek
) {
  try {
    // Get user's time slots for the specified day
    const userDaySlots = userAvailability[dayOfWeek] || [];
    
    if (userDaySlots.length === 0) {
      return { data: [], error: null };
    }

    // Query players in the same city with homecourt information
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        *,
        availability,
        courts!homecourt_id (
          name
        )
      `)
      .eq('city_id', userCityId)
      .eq('is_active', true) // Only include active players
      .neq('auth_user_id', userId)
      .not('availability', 'is', null);

    if (error) throw error;

    // Transform the data to include homecourt_name at the top level
    const transformedPlayers = players?.map(player => ({
      ...player,
      homecourt_name: player.courts?.name || null
    })) || [];

    // Filter players who have matching time slots for the specified day
    const availablePlayers = transformedPlayers.filter(player => {
      if (!player.availability) return false;
      
      const playerAvailability = player.availability as AvailabilityData;
      const playerDaySlots = playerAvailability[dayOfWeek] || [];
      
      return playerDaySlots.some(slot => userDaySlots.includes(slot));
    });

    return { data: availablePlayers, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Helper function to get all available players in a city (regardless of matching time slots)
export async function getAllAvailablePlayersInCity(
  userId: string,
  userCityId: string
) {
  try {
    // Query all players in the same city with homecourt information
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        *,
        availability,
        available_today,
        available_today_updated_at,
        courts!homecourt_id (
          name
        )
      `)
      .eq('city_id', userCityId)
      .eq('is_active', true) // Only include active players
      .neq('auth_user_id', userId) // Exclude current user
      .not('availability', 'is', null);

    if (error) throw error;

    // Fetch orgs with court_id to map homecourt → club name
    const { data: courtOrgs } = await supabase
      .from('organizations')
      .select('court_id, name')
      .not('court_id', 'is', null)
    const courtOrgMap = new Map<string, string>()
    if (courtOrgs) {
      for (const o of courtOrgs) {
        if (o.court_id) courtOrgMap.set(o.court_id, o.name)
      }
    }

    // Transform the data to include homecourt_name and club_name at the top level
    const transformedPlayers = players?.map(player => ({
      ...player,
      homecourt_name: player.courts?.name || null,
      club_name: player.homecourt_id ? (courtOrgMap.get(player.homecourt_id) || null) : null,
    })) || [];

    // Filter out players with empty availability
    const availablePlayers = transformedPlayers.filter(player => {
      if (!player.availability) return false;

      const playerAvailability = player.availability as AvailabilityData;

      // Check if player has at least one time slot on any day
      return Object.values(playerAvailability).some(
        slots => Array.isArray(slots) && slots.length > 0
      );
    });

    // Sort players: available today first, then by rating
    availablePlayers.sort((a, b) => {
      // Check if players are available today
      const aAvailableToday = isAvailableToday(a.available_today, a.available_today_updated_at);
      const bAvailableToday = isAvailableToday(b.available_today, b.available_today_updated_at);

      // If one is available today and the other isn't, prioritize the available one
      if (aAvailableToday && !bAvailableToday) return -1;
      if (!aAvailableToday && bAvailableToday) return 1;

      // If both have same availability status, sort by rating
      return (b.rating || 0) - (a.rating || 0);
    });

    return { data: availablePlayers, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Paginated version of getAllAvailablePlayersInCity for infinite scroll
export const PLAYERS_PAGE_SIZE = 20;

export async function getAvailablePlayersPage(
  userId: string,
  userCityId: string,
  options: {
    page: number;
    pageSize?: number;
    ratingMin?: number;
    ratingMax?: number;
  }
) {
  const { page, pageSize = PLAYERS_PAGE_SIZE, ratingMin, ratingMax } = options;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    // Build the query with server-side filtering and pagination
    let query = supabase
      .from('players')
      .select(`
        *,
        availability,
        available_today,
        available_today_updated_at,
        courts!homecourt_id (
          name
        )
      `, { count: 'exact' })
      .eq('city_id', userCityId)
      .eq('is_active', true)
      .neq('auth_user_id', userId)
      .not('availability', 'is', null);

    // Server-side rating filter
    if (ratingMin !== undefined) {
      query = query.gte('rating', ratingMin);
    }
    if (ratingMax !== undefined) {
      query = query.lte('rating', ratingMax);
    }

    // Sort by rating descending, then paginate
    query = query
      .order('rating', { ascending: false, nullsFirst: false })
      .range(from, to);

    const { data: players, error, count } = await query;

    if (error) throw error;

    // Fetch orgs with court_id to map homecourt → club name
    const { data: courtOrgs } = await supabase
      .from('organizations')
      .select('court_id, name')
      .not('court_id', 'is', null);
    const courtOrgMap = new Map<string, string>();
    if (courtOrgs) {
      for (const o of courtOrgs) {
        if (o.court_id) courtOrgMap.set(o.court_id, o.name);
      }
    }

    // Transform the data
    const transformedPlayers = players?.map(player => ({
      ...player,
      homecourt_name: player.courts?.name || null,
      club_name: player.homecourt_id ? (courtOrgMap.get(player.homecourt_id) || null) : null,
    })) || [];

    // Filter out players with empty availability (client-side, can't easily query JSONB array length)
    const availablePlayers = transformedPlayers.filter(player => {
      if (!player.availability) return false;
      const playerAvailability = player.availability as AvailabilityData;
      return Object.values(playerAvailability).some(
        slots => Array.isArray(slots) && slots.length > 0
      );
    });

    const totalCount = count ?? 0;
    const hasMore = from + pageSize < totalCount;

    return { data: availablePlayers, hasMore, error: null };
  } catch (error) {
    return { data: null, hasMore: false, error };
  }
} 