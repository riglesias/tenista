import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ClubDetailClient } from "@/components/clubs/club-detail-client"
import { notFound } from "next/navigation"
import { Organization, OrganizationPlayer, League, Court } from "@/types/database.types"

async function getClub(id: string): Promise<Organization | null> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error fetching club:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getClub:', error)
    return null
  }
}

async function getCourtById(courtId: string): Promise<Court | null> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single()
    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

async function getAllCourts(): Promise<Court[]> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .order('name')
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

async function getClubMembers(organizationId: string): Promise<any[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('organization_players')
      .select(`
        organization_id,
        player_id,
        added_at,
        player:players!player_id(
          id, first_name, last_name, rating, avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching club members:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getClubMembers:', error)
    return []
  }
}

async function getClubCompetitions(organizationId: string): Promise<any[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching club competitions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getClubCompetitions:', error)
    return []
  }
}

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [club, members, competitions, allCourts] = await Promise.all([
    getClub(id),
    getClubMembers(id),
    getClubCompetitions(id),
    getAllCourts(),
  ])

  if (!club) {
    notFound()
  }

  const court = club.court_id ? await getCourtById(club.court_id) : null

  return <ClubDetailClient club={club} members={members} competitions={competitions} court={court} courts={allCourts} />
}
