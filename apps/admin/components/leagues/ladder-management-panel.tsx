"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LadderRankingsTable } from "@/components/tables/ladder-rankings-table"
import { LadderChallengesTable } from "@/components/tables/ladder-challenges-table"
import { LadderConfigForm } from "./ladder-config-form"
import {
  getLadderRankings,
  getLadderChallenges,
  getLadderPositionHistory,
  getLadderStats,
  LadderRankingWithPlayer,
  LadderChallengeWithPlayers
} from "@/lib/actions/ladder-admin.actions"
import { League, LadderConfig, LadderPositionHistory, DEFAULT_LADDER_CONFIG } from "@/types/database.types"
import { Users, Swords, Clock, Trophy, History, Settings, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface LadderManagementPanelProps {
  league: League
}

export function LadderManagementPanel({ league }: LadderManagementPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rankings, setRankings] = useState<LadderRankingWithPlayer[]>([])
  const [challenges, setChallenges] = useState<LadderChallengeWithPlayers[]>([])
  const [history, setHistory] = useState<LadderPositionHistory[]>([])
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    pendingChallenges: 0,
    acceptedChallenges: 0,
    completedChallenges: 0,
    recentMatches: 0
  })

  const ladderConfig: LadderConfig = league.ladder_config || DEFAULT_LADDER_CONFIG

  useEffect(() => {
    loadData()
  }, [league.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rankingsResult, challengesResult, historyResult, statsResult] = await Promise.all([
        getLadderRankings(league.id),
        getLadderChallenges(league.id),
        getLadderPositionHistory(league.id, 50),
        getLadderStats(league.id)
      ])

      if (rankingsResult.data) setRankings(rankingsResult.data)
      if (challengesResult.data) setChallenges(challengesResult.data)
      if (historyResult.data) setHistory(historyResult.data)
      if (statsResult.data) setStats(statsResult.data)
    } catch (error) {
      console.error('Error loading ladder data:', error)
      toast.error('Failed to load ladder data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePlayers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingChallenges + stats.acceptedChallenges}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingChallenges} pending, {stats.acceptedChallenges} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed Challenges</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedChallenges}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentMatches}</div>
            <p className="text-xs text-muted-foreground">
              Matches in last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rankings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rankings" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Challenges
            {(stats.pendingChallenges + stats.acceptedChallenges) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pendingChallenges + stats.acceptedChallenges}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ladder Rankings</CardTitle>
              <CardDescription>
                Current player standings. Click on a player to adjust their position.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LadderRankingsTable
                rankings={rankings}
                leagueId={league.id}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Challenges</CardTitle>
              <CardDescription>
                Manage active and past challenges. You can cancel challenges or force walkovers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LadderChallengesTable
                challenges={challenges}
                leagueId={league.id}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position History</CardTitle>
              <CardDescription>
                Recent position changes in the ladder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No position history yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Player</th>
                        <th className="p-3 text-left text-sm font-medium">Change</th>
                        <th className="p-3 text-left text-sm font-medium">Reason</th>
                        <th className="p-3 text-left text-sm font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => {
                        const player = item.player as any
                        const positionChange = item.old_position - item.new_position
                        return (
                          <tr key={item.id} className="border-b">
                            <td className="p-3">
                              <div className="font-medium">
                                {player?.first_name} {player?.last_name}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">#{item.old_position}</span>
                                <span>→</span>
                                <span className="font-medium">#{item.new_position}</span>
                                {positionChange !== 0 && (
                                  <Badge variant={positionChange > 0 ? "default" : "destructive"}>
                                    {positionChange > 0 ? `+${positionChange}` : positionChange}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">
                                {formatChangeReason(item.change_reason)}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-sm">
                              {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ladder Configuration</CardTitle>
              <CardDescription>
                Rules and settings for this ladder competition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LadderConfigForm
                value={ladderConfig}
                onChange={() => {}}
                disabled={true}
              />
              <p className="text-sm text-muted-foreground mt-4">
                To modify these settings, edit the competition from the main league detail page.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function formatChangeReason(reason: string): string {
  const labels: Record<string, string> = {
    match_win: 'Match Win',
    match_loss: 'Match Loss',
    inactivity_penalty: 'Inactivity',
    opponent_walkover: 'Walkover',
    admin_adjustment: 'Admin',
    initial_placement: 'Initial'
  }
  return labels[reason] || reason
}
