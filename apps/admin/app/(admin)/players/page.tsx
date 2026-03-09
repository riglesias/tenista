import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayersTable } from "@/components/tables/players-table"
import { Plus, Users, UserCheck, UserX, Download } from "lucide-react"

async function getPlayers() {
  const supabase = await createServerSupabaseClient()

  try {
    // Use RPC function to get players with email
    const { data: players, error } = await supabase
      .rpc('get_players_with_email')

    if (error) {
      console.error('Error fetching players:', error.message || 'Unknown error', error)
      return []
    }

    if (!players || players.length === 0) return []

    // Fetch club memberships for all players
    const { data: memberships } = await supabase
      .from('organization_players')
      .select('player_id, organizations(name)')

    // Build a map of player_id -> club name
    const clubMap = new Map<string, string>()
    if (memberships) {
      for (const m of memberships) {
        const orgName = (m.organizations as any)?.name
        if (orgName) clubMap.set(m.player_id, orgName)
      }
    }

    // Merge club_name into player data
    return players.map((p: any) => ({
      ...p,
      club_name: clubMap.get(p.id) || null,
    }))
  } catch (error) {
    console.error('Error in getPlayers:', error)
    return []
  }
}

export default async function PlayersPage() {
  const players = await getPlayers()
  const activePlayers = players.filter(p => p.is_active)
  const inactivePlayers = players.filter(p => !p.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Players</h2>
          <p className="text-muted-foreground">
            Manage player profiles and information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlayers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active players only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePlayers.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Players</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactivePlayers.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Players</CardTitle>
          <CardDescription>
            View and manage player profiles. Click on any player for more options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayersTable players={players} />
        </CardContent>
      </Card>
    </div>
  )
}