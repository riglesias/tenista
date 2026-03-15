"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayersTable } from "@/components/tables/players-table"
import { PlayerEditDialog } from "@/components/players/player-edit-dialog"
import { Download, Users, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface Player {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  rating: number
  is_active: boolean
  city_name: string | null
  club_name: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

interface PlayersPageContentProps {
  players: Player[]
}

export function PlayersPageContent({ players }: PlayersPageContentProps) {
  const router = useRouter()
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const activePlayers = players.filter(p => p.is_active)
  const inactivePlayers = players.filter(p => !p.is_active)

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
    setDialogOpen(true)
  }

  const handleToggleActive = async (player: Player) => {
    const supabase = createBrowserSupabaseClient()
    const newStatus = !player.is_active

    try {
      const { error } = await supabase
        .from('players')
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', player.id)

      if (error) throw error

      const name = `${player.first_name || ""} ${player.last_name || ""}`.trim() || "Player"
      toast.success(newStatus ? `${name} is now active` : `${name} has been deactivated`)
      router.refresh()
    } catch (error: any) {
      toast.error(`Could not update ${player.first_name || "player"}. Please try again.`)
    }
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingPlayer(null)
    router.refresh()
  }

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
            <div className="text-2xl font-bold">{players.length}</div>
            <p className="text-xs text-muted-foreground">
              All registered players
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
          <PlayersTable
            players={players}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <PlayerEditDialog
        player={editingPlayer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
