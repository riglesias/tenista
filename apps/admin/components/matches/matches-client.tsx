"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MatchesTable } from "@/components/tables/matches-table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Match, Player, Tournament } from "@/types/database.types"
import { format } from "date-fns"
import { Trophy, Calendar, Users, Plus, Minus, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { adminEditMatchResult } from "@/lib/actions/ladder-admin.actions"

interface MatchWithRelations extends Match {
  ladder_challenge_id?: string | null
  player_a?: Player
  player_b?: Player
  winner?: Player
  tournament?: Tournament
  // Fields from player_matches
  player1_id?: string
  player2_id?: string
  match_date?: string
  game_type?: string
  match_type?: string
  number_of_sets?: number
  is_verified?: boolean
}

interface MatchesClientProps {
  matches: MatchWithRelations[]
}

interface SetScore {
  player1: number
  player2: number
}

export function MatchesClient({ matches }: MatchesClientProps) {
  const router = useRouter()
  const [localMatches, setLocalMatches] = useState<MatchWithRelations[]>(matches)
  const [selectedMatch, setSelectedMatch] = useState<MatchWithRelations | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Edit form state
  const [matchDate, setMatchDate] = useState("")
  const [winnerId, setWinnerId] = useState<string>("")
  const [scores, setScores] = useState<SetScore[]>([{ player1: 0, player2: 0 }])
  const [gameType, setGameType] = useState<string>("competitive")
  const [matchType, setMatchType] = useState<string>("singles")
  const [numberOfSets, setNumberOfSets] = useState<number>(3)
  const [isVerified, setIsVerified] = useState(false)

  // Update local matches when props change
  useEffect(() => {
    setLocalMatches(matches)
  }, [matches])

  const handleEdit = useCallback((match: MatchWithRelations) => {
    setSelectedMatch(match)
    // Initialize form with match data
    setMatchDate(match.match_date ? match.match_date.split('T')[0] : new Date().toISOString().split('T')[0])
    setWinnerId(match.winner_id || "")
    setGameType(match.game_type || "competitive")
    setMatchType(match.match_type || "singles")
    setNumberOfSets(match.number_of_sets || 3)
    setIsVerified(match.is_verified || false)

    // Parse scores
    if (match.scores && Array.isArray(match.scores)) {
      setScores(match.scores.map((s: any) => ({
        player1: s.player1 || 0,
        player2: s.player2 || 0
      })))
    } else {
      setScores([{ player1: 0, player2: 0 }])
    }

    setEditDialogOpen(true)
  }, [])

  const handleView = useCallback((match: MatchWithRelations) => {
    setSelectedMatch(match)
    setViewDialogOpen(true)
  }, [])

  const formatScore = (scores: any) => {
    if (!scores || typeof scores !== 'object') {
      return 'No score recorded'
    }

    if (Array.isArray(scores)) {
      return scores.map(s => `${s.player1 || 0}-${s.player2 || 0}`).join(", ")
    }

    return JSON.stringify(scores)
  }

  const addSet = () => {
    if (scores.length < 5) {
      setScores([...scores, { player1: 0, player2: 0 }])
    }
  }

  const removeSet = () => {
    if (scores.length > 1) {
      setScores(scores.slice(0, -1))
    }
  }

  const updateSetScore = (index: number, player: 'player1' | 'player2', value: number) => {
    const newScores = [...scores]
    newScores[index] = { ...newScores[index], [player]: Math.max(0, Math.min(7, value)) }
    setScores(newScores)
  }

  const handleSaveMatch = async () => {
    if (!selectedMatch) return

    setLoading(true)

    try {
      // Determine if winner is valid
      if (winnerId && winnerId !== selectedMatch.player1_id && winnerId !== selectedMatch.player_b_id &&
          winnerId !== selectedMatch.player_a_id && winnerId !== selectedMatch.player2_id) {
        toast.error("Invalid winner selected")
        return
      }

      const { error } = await adminEditMatchResult(selectedMatch.id, {
        scores,
        winnerId: winnerId || null,
        matchDate,
        isVerified,
        gameType,
        matchType,
        numberOfSets,
      })

      if (error) {
        toast.error(`Failed to update match: ${error}`)
        return
      }

      // If match has ladder_challenge_id and winner changed, show info toast
      if (selectedMatch.ladder_challenge_id && winnerId !== selectedMatch.winner_id) {
        toast.info("Ladder positions have been updated to reflect the new winner")
      }

      // Update local state to reflect changes immediately
      const updateData = {
        match_date: matchDate,
        winner_id: winnerId || null,
        scores: scores,
        game_type: gameType,
        match_type: matchType,
        number_of_sets: numberOfSets,
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      }
      setLocalMatches(prevMatches =>
        prevMatches.map(m =>
          m.id === selectedMatch.id
            ? { ...m, ...updateData, status: isVerified ? 'completed' : 'pending' }
            : m
        )
      )

      toast.success("Match updated successfully")
      setEditDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to update match: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const player1Name = selectedMatch?.player_a
    ? `${selectedMatch.player_a.first_name} ${selectedMatch.player_a.last_name}`
    : 'Player 1'
  const player2Name = selectedMatch?.player_b
    ? `${selectedMatch.player_b.first_name} ${selectedMatch.player_b.last_name}`
    : 'Player 2'

  return (
    <>
      <MatchesTable
        matches={localMatches}
        onEdit={handleEdit}
        onView={handleView}
      />

      {/* View Match Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Match Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this match
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-6">
              {/* Match Header */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {selectedMatch.player_a
                        ? `${selectedMatch.player_a.first_name} ${selectedMatch.player_a.last_name}`
                        : 'TBD'
                      }
                    </CardTitle>
                    <CardDescription>
                      Rating: {selectedMatch.player_a?.rating || 'N/A'}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {selectedMatch.player_b
                        ? `${selectedMatch.player_b.first_name} ${selectedMatch.player_b.last_name}`
                        : 'TBD'
                      }
                    </CardTitle>
                    <CardDescription>
                      Rating: {selectedMatch.player_b?.rating || 'N/A'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Match Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tournament:</span>
                    <span>{selectedMatch.tournament?.name || 'Unknown'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Round:</span>
                    <span>{selectedMatch.round_number}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Last Updated:</span>
                    <span>{format(new Date(selectedMatch.updated_at), "PPP")}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge className={
                      selectedMatch.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedMatch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedMatch.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }>
                      {selectedMatch.status.charAt(0).toUpperCase() + selectedMatch.status.slice(1)}
                    </Badge>
                  </div>

                  {selectedMatch.winner_id && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Winner:</span>
                      <span className="text-green-700 font-semibold">
                        {selectedMatch.winner
                          ? `${selectedMatch.winner.first_name} ${selectedMatch.winner.last_name}`
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="font-medium">Score:</span>
                    <div className="font-mono text-sm">
                      {formatScore(selectedMatch.scores)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewDialogOpen(false)
                  handleEdit(selectedMatch)
                }}>
                  Edit Match
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Match Result</DialogTitle>
            <DialogDescription>
              Update match result and score details
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-6">
              {/* Ladder challenge warning */}
              {selectedMatch.ladder_challenge_id && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This match is linked to a ladder challenge. Changing the winner will automatically update ladder positions.
                  </p>
                </div>
              )}

              {/* Players info (read-only) */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Player 1</p>
                  <p className="font-medium">{player1Name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Player 2</p>
                  <p className="font-medium">{player2Name}</p>
                </div>
              </div>

              {/* Match Date */}
              <div className="space-y-2">
                <Label htmlFor="match_date">Match Date</Label>
                <Input
                  id="match_date"
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                />
              </div>

              {/* Game Type and Match Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Game Type</Label>
                  <Select value={gameType} onValueChange={setGameType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Match Type</Label>
                  <Select value={matchType} onValueChange={setMatchType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">Singles</SelectItem>
                      <SelectItem value="doubles">Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Number of Sets */}
              <div className="space-y-2">
                <Label>Number of Sets</Label>
                <Select value={numberOfSets.toString()} onValueChange={(v) => setNumberOfSets(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Set</SelectItem>
                    <SelectItem value="3">Best of 3</SelectItem>
                    <SelectItem value="5">Best of 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Score Entry */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Set Scores</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeSet}
                      disabled={scores.length <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSet}
                      disabled={scores.length >= 5}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-sm text-muted-foreground">
                    <div></div>
                    <div className="text-center">{player1Name.split(' ')[0]}</div>
                    <div className="text-center">{player2Name.split(' ')[0]}</div>
                  </div>

                  {scores.map((set, index) => (
                    <div key={index} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
                      <Label className="text-sm">Set {index + 1}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="7"
                        value={set.player1}
                        onChange={(e) => updateSetScore(index, 'player1', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="7"
                        value={set.player2}
                        onChange={(e) => updateSetScore(index, 'player2', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Winner Selection */}
              <div className="space-y-2">
                <Label>Winner</Label>
                <Select
                  value={winnerId || "none"}
                  onValueChange={(v) => setWinnerId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No winner yet</SelectItem>
                    {selectedMatch.player_a && (selectedMatch.player1_id || selectedMatch.player_a_id) && (
                      <SelectItem value={selectedMatch.player1_id || selectedMatch.player_a_id || ""}>
                        {player1Name}
                      </SelectItem>
                    )}
                    {selectedMatch.player_b && (selectedMatch.player2_id || selectedMatch.player_b_id) && (
                      <SelectItem value={selectedMatch.player2_id || selectedMatch.player_b_id || ""}>
                        {player2Name}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Verified Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_verified" className="text-sm font-normal">
                  Mark as verified (completes the match)
                </Label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMatch} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}