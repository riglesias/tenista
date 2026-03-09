"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { League, City, Player } from "@/types/database.types"
import { format } from "date-fns"
import { Trophy, Users, Calendar, DollarSign, MapPin, Target, Award } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface LeagueWithRelations extends League {
  city?: City
  current_players?: number
}

interface LeaguePlayer {
  id: string
  league_id: string
  player_id: string
  points: number
  matches_played: number
  wins: number
  losses: number
  player?: Player
}

interface LeagueDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  league: LeagueWithRelations | null
}

const divisionLabels: Record<string, string> = {
  division_1: "Division 1",
  division_2: "Division 2",
  division_3: "Division 3",
  division_4: "Division 4",
  open: "Open",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

export function LeagueDetailsDialog({ open, onOpenChange, league }: LeagueDetailsDialogProps) {
  const [leaguePlayers, setLeaguePlayers] = useState<LeaguePlayer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchLeaguePlayers = async () => {
      if (!league) return
      
      setLoading(true)
      try {
        const supabase = createBrowserSupabaseClient()
        const { data, error } = await supabase
          .from('league_players')
          .select(`
            *,
            player:players!player_id(
              id, first_name, last_name, rating, country_code
            )
          `)
          .eq('league_id', league.id)
          .order('points', { ascending: false })

        if (error) {
          console.error('Error fetching league players:', error)
        } else {
          setLeaguePlayers(data || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (league && open) {
      fetchLeaguePlayers()
    }
  }, [league, open])

  if (!league) return null

  const startDate = new Date(league.start_date)
  const endDate = new Date(league.end_date)
  const now = new Date()
  
  let status = "upcoming"
  if (now > endDate) status = "completed"
  else if (now >= startDate && now <= endDate) status = "active"

  const winRate = (wins: number, losses: number) => {
    const total = wins + losses
    if (total === 0) return "0"
    return ((wins / total) * 100).toFixed(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5" />
            {league.name}
          </DialogTitle>
          <DialogDescription>
            League details and player standings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">League Details</TabsTrigger>
            <TabsTrigger value="players">Players ({leaguePlayers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* League Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Division</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-sm">
                    {divisionLabels[league.division] || league.division || "Open"}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant={status === "active" ? "default" : status === "upcoming" ? "secondary" : "outline"}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {league.current_players || leaguePlayers.length} / {league.max_players} players
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500"
                        style={{ 
                          width: `${Math.min(100, ((league.current_players || leaguePlayers.length) / league.max_players) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{league.location || "TBD"}</p>
                    {league.city && (
                      <p className="text-xs text-muted-foreground">
                        {league.city.name}, {league.city.state_province || league.city.country_code}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Entry Fee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {league.is_free ? (
                    <Badge variant="outline" className="text-green-600">Free</Badge>
                  ) : (
                    <p className="text-sm font-medium">${(league.price_cents / 100).toFixed(2)}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Rating Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {league.min_rating || "0"} - {league.max_rating || "∞"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Points System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-xs">Win: {league.default_points_win} pts</p>
                    <p className="text-xs">Loss: {league.default_points_loss} pts</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* League Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {league.is_active && <Badge variant="outline">Active</Badge>}
                  {league.is_private && <Badge variant="outline">Private</Badge>}
                  {league.has_playoffs && <Badge variant="outline">Has Playoffs</Badge>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading players...</div>
            ) : leaguePlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No players enrolled yet</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-center">Matches</TableHead>
                      <TableHead className="text-center">W-L</TableHead>
                      <TableHead className="text-center">Win %</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaguePlayers.map((lp, index) => (
                      <TableRow key={lp.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                          {index === 0 && " 🏆"}
                          {index === 1 && " 🥈"}
                          {index === 2 && " 🥉"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">
                                {lp.player?.first_name} {lp.player?.last_name}
                              </p>
                              {lp.player?.country_code && (
                                <p className="text-xs text-muted-foreground">{lp.player.country_code}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lp.player?.rating || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{lp.matches_played}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 font-medium">{lp.wins}</span>
                          <span className="text-muted-foreground"> - </span>
                          <span className="text-red-600 font-medium">{lp.losses}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {winRate(lp.wins, lp.losses)}%
                        </TableCell>
                        <TableCell className="text-right font-bold">{lp.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}