import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, MapPin, Users, TrendingUp, UserPlus, Calendar, Award } from "lucide-react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { formatDistanceToNow, format } from "date-fns"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

interface DashboardStats {
  totalMatches: number
  activePlayers: number
  activeCourts: number
  activeLeagues: number
}

interface RecentPlayer {
  id: string
  first_name: string
  last_name: string
  created_at: string
}

interface RecentMatch {
  id: string
  match_date: string
  player1: { first_name: string; last_name: string } | null
  player2: { first_name: string; last_name: string } | null
}

interface RecentLeague {
  id: string
  name: string
  created_at: string
}

type ActivityItem = {
  type: 'player' | 'match' | 'league'
  title: string
  timestamp: string
  color: string
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient()

  const [matchesResult, playersResult, courtsResult, leaguesResult] = await Promise.all([
    supabase.from('player_matches').select('id', { count: 'exact', head: true }),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('courts').select('id', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
    supabase.from('leagues').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  return {
    totalMatches: matchesResult.count ?? 0,
    activePlayers: playersResult.count ?? 0,
    activeCourts: courtsResult.count ?? 0,
    activeLeagues: leaguesResult.count ?? 0,
  }
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  const supabase = await createServerSupabaseClient()

  const [playersResult, matchesResult, leaguesResult] = await Promise.all([
    supabase
      .from('players')
      .select('id, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('player_matches')
      .select(`
        id,
        match_date,
        player1:players!player_matches_player1_id_fkey(first_name, last_name),
        player2:players!player_matches_player2_id_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('leagues')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const activities: ActivityItem[] = []

  // Add recent players
  if (playersResult.data) {
    for (const player of playersResult.data as RecentPlayer[]) {
      activities.push({
        type: 'player',
        title: `${player.first_name} ${player.last_name} registered`,
        timestamp: player.created_at,
        color: 'bg-green-500',
      })
    }
  }

  // Add recent matches
  if (matchesResult.data) {
    for (const match of matchesResult.data as RecentMatch[]) {
      const p1Name = match.player1 ? `${match.player1.first_name} ${match.player1.last_name}` : 'Unknown'
      const p2Name = match.player2 ? `${match.player2.first_name} ${match.player2.last_name}` : 'Unknown'
      activities.push({
        type: 'match',
        title: `Match: ${p1Name} vs ${p2Name}`,
        timestamp: match.match_date,
        color: 'bg-blue-500',
      })
    }
  }

  // Add recent leagues
  if (leaguesResult.data) {
    for (const league of leaguesResult.data as RecentLeague[]) {
      activities.push({
        type: 'league',
        title: `League "${league.name}" created`,
        timestamp: league.created_at,
        color: 'bg-yellow-500',
      })
    }
  }

  // Sort by timestamp descending and take top 5
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'player':
      return <UserPlus className="h-4 w-4 text-green-500" />
    case 'match':
      return <Award className="h-4 w-4 text-blue-500" />
    case 'league':
      return <Calendar className="h-4 w-4 text-yellow-500" />
  }
}

interface ChartDataPoint {
  month: string
  count: number
}

function groupByMonth(dates: string[]): ChartDataPoint[] {
  const counts = new Map<string, number>()
  for (const dateStr of dates) {
    const key = format(new Date(dateStr), "MMM yyyy")
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(([month, count]) => ({ month, count }))
}

async function getPlayerSignupsByMonth(): Promise<ChartDataPoint[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from("players")
    .select("created_at")
    .order("created_at", { ascending: true })
  if (!data) return []
  return groupByMonth(data.map((p) => p.created_at))
}

async function getMatchesByMonth(): Promise<ChartDataPoint[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from("player_matches")
    .select("match_date")
    .order("match_date", { ascending: true })
  if (!data) return []
  return groupByMonth(data.map((m) => m.match_date))
}

export default async function DashboardPage() {
  const [stats, activities, playerSignups, matchesByMonth] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getPlayerSignupsByMonth(),
    getMatchesByMonth(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to Tenista Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
            <p className="text-xs text-muted-foreground">Across all leagues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlayers}</div>
            <p className="text-xs text-muted-foreground">Registered players</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourts}</div>
            <p className="text-xs text-muted-foreground">Available courts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leagues</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLeagues}</div>
            <p className="text-xs text-muted-foreground">Running leagues</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts playerSignups={playerSignups} matchesByMonth={matchesByMonth} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 ${activity.color} rounded-full`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {getActivityIcon(activity.type)}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}