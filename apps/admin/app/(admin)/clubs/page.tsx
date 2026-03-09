import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ClubsPageContent } from "@/components/clubs/clubs-page-content"
import { Organization, Court } from "@/types/database.types"

interface ClubWithStats extends Organization {
  member_count: number
  competition_count: number
  court_name?: string | null
}

async function getClubs(): Promise<ClubWithStats[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organizations:', error)
      return []
    }

    if (!orgs) return []

    // Get court names for orgs that have court_id
    const courtIds = orgs.map(o => o.court_id).filter(Boolean) as string[]
    const courtNameMap: Record<string, string> = {}
    if (courtIds.length > 0) {
      const { data: courts } = await supabase
        .from('courts')
        .select('id, name')
        .in('id', courtIds)
      if (courts) {
        courts.forEach(c => { courtNameMap[c.id] = c.name })
      }
    }

    // Get member counts
    const { data: memberCounts } = await supabase
      .from('organization_players')
      .select('organization_id')

    const memberCountMap: Record<string, number> = {}
    if (memberCounts) {
      memberCounts.forEach(mp => {
        memberCountMap[mp.organization_id] = (memberCountMap[mp.organization_id] || 0) + 1
      })
    }

    // Get competition counts (leagues linked to organizations)
    const { data: competitionCounts } = await supabase
      .from('leagues')
      .select('organization_id')
      .not('organization_id', 'is', null)

    const competitionCountMap: Record<string, number> = {}
    if (competitionCounts) {
      competitionCounts.forEach(l => {
        if (l.organization_id) {
          competitionCountMap[l.organization_id] = (competitionCountMap[l.organization_id] || 0) + 1
        }
      })
    }

    return orgs.map(org => ({
      ...org,
      member_count: memberCountMap[org.id] || 0,
      competition_count: competitionCountMap[org.id] || 0,
      court_name: org.court_id ? courtNameMap[org.court_id] || null : null,
    }))
  } catch (error) {
    console.error('Error in getClubs:', error)
    return []
  }
}

async function getCourts(): Promise<Court[]> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .order('name')
    if (error) {
      console.error('Error fetching courts:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error in getCourts:', error)
    return []
  }
}

export default async function ClubsPage() {
  const [clubs, courts] = await Promise.all([getClubs(), getCourts()])

  const totalMembers = clubs.reduce((sum, c) => sum + c.member_count, 0)
  const clubCompetitions = clubs.reduce((sum, c) => sum + c.competition_count, 0)
  const withJoinCodes = clubs.filter(c => c.join_code).length

  const stats = {
    totalClubs: clubs.length,
    totalMembers,
    clubCompetitions,
    withJoinCodes,
  }

  return <ClubsPageContent clubs={clubs} stats={stats} courts={courts} />
}
