"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { League, City, Player, Organization, MatchFormat, DEFAULT_MATCH_FORMAT } from "@/types/database.types"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Trophy, Calendar, MapPin, Target, Award,
  ArrowLeft, Edit2, Save, X, Loader2, UserMinus, ImageIcon, Swords, ListOrdered, Building2
} from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LadderManagementPanel } from "./ladder-management-panel"

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

interface LeagueDetailClientProps {
  league: LeagueWithRelations
  players: LeaguePlayer[]
  cities: City[]
  organizations?: Organization[]
  courtsMap?: Record<string, string>
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

const divisionOptions = [
  { value: "division_1", label: "Division 1" },
  { value: "division_2", label: "Division 2" },
  { value: "division_3", label: "Division 3" },
  { value: "division_4", label: "Division 4" },
]

export function LeagueDetailClient({ league, players, cities, organizations = [], courtsMap = {} }: LeagueDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [playerToRemove, setPlayerToRemove] = useState<LeaguePlayer | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [formData, setFormData] = useState({
    name: league.name,
    start_date: league.start_date,
    end_date: league.end_date,
    max_players: league.max_players,
    location: league.location || "",
    city_id: league.city_id || "",
    division: league.division || "division_1",
    min_rating: league.min_rating || 0,
    max_rating: league.max_rating || 10,
    is_active: league.is_active,
    is_private: league.is_private,
    is_free: league.is_free,
    price_cents: league.price_cents,
    has_playoffs: league.has_playoffs,
    default_points_win: league.default_points_win,
    default_points_loss: league.default_points_loss,
    image_url: league.image_url || null,
    competition_type: league.competition_type || 'round_robin',
    match_format: league.match_format || DEFAULT_MATCH_FORMAT,
    organization_id: league.organization_id || "",
  })

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from('leagues')
        .update({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_players: formData.max_players,
          location: formData.location,
          city_id: formData.city_id || null,
          division: formData.division,
          min_rating: formData.min_rating,
          max_rating: formData.max_rating,
          is_active: formData.is_active,
          is_private: formData.is_private,
          is_free: formData.is_free,
          price_cents: formData.price_cents,
          has_playoffs: formData.has_playoffs,
          default_points_win: formData.default_points_win,
          default_points_loss: formData.default_points_loss,
          image_url: formData.image_url,
          competition_type: formData.competition_type,
          match_format: formData.match_format,
          organization_id: formData.organization_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', league.id)

      if (error) {
        console.error('Error updating league:', error)
        toast.error(`Failed to update competition: ${error.message}`)
      } else {
        toast.success('Competition updated successfully')
        setIsEditing(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: league.name,
      start_date: league.start_date,
      end_date: league.end_date,
      max_players: league.max_players,
      location: league.location || "",
      city_id: league.city_id || "",
      division: league.division || "division_1",
      min_rating: league.min_rating || 0,
      max_rating: league.max_rating || 10,
      is_active: league.is_active,
      is_private: league.is_private,
      is_free: league.is_free,
      price_cents: league.price_cents,
      has_playoffs: league.has_playoffs,
      default_points_win: league.default_points_win,
      default_points_loss: league.default_points_loss,
      image_url: league.image_url || null,
      competition_type: league.competition_type || 'round_robin',
      match_format: league.match_format || DEFAULT_MATCH_FORMAT,
      organization_id: league.organization_id || "",
    })
    setIsEditing(false)
  }

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return

    setIsRemoving(true)
    try {
      const supabase = createBrowserSupabaseClient()

      // Delete the league_players record
      const { error } = await supabase
        .from('league_players')
        .delete()
        .eq('id', playerToRemove.id)

      if (error) {
        console.error('Error removing player:', error)
        toast.error(`Failed to remove player: ${error.message}`)
      } else {
        toast.success(`${playerToRemove.player?.first_name} ${playerToRemove.player?.last_name} has been removed from the competition`)
        setPlayerToRemove(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while removing the player')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/leagues')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-3xl font-bold h-auto py-1"
                />
              ) : (
                league.name
              )}
            </h2>
            <p className="text-muted-foreground">
              {divisionLabels[league.division] || league.division || "Open"} • 
              {' '}{league.location || "No location set"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Competition
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Competition Details</TabsTrigger>
          <TabsTrigger value="players">Players ({players.length})</TabsTrigger>
          {league.competition_type === 'ladder' && (
            <TabsTrigger value="ladder" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              Ladder
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={status === "active" ? "default" : status === "upcoming" ? "secondary" : "outline"}
                  className="text-sm"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                {isEditing && (
                  <div className="mt-3 flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="text-xs">Active</Label>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Competition Type</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select
                    value={formData.competition_type}
                    onValueChange={(value) => setFormData({ ...formData, competition_type: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="ladder">Ladder</SelectItem>
                      <SelectItem value="playoffs_only">Bracket/Tournament</SelectItem>
                      <SelectItem value="elimination">Elimination</SelectItem>
                      <SelectItem value="swiss">Swiss</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary" className="text-sm capitalize">
                    {league.competition_type?.replace('_', ' ') || 'Round Robin'}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Division</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select
                    value={formData.division}
                    onValueChange={(value) => setFormData({ ...formData, division: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {divisionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary" className="text-sm">
                    {divisionLabels[league.division] || league.division || "Open"}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {isEditing ? (
                    <Input
                      type="number"
                      min="2"
                      value={formData.max_players}
                      onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                      className="h-8"
                    />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">
                        {league.current_players || players.length} / {league.max_players}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-green-500"
                          style={{ 
                            width: `${Math.min(100, ((league.current_players || players.length) / league.max_players) * 100)}%` 
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Entry Fee</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_free"
                        checked={formData.is_free}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                      />
                      <Label htmlFor="is_free" className="text-xs">Free</Label>
                    </div>
                    {!formData.is_free && (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(formData.price_cents / 100).toFixed(2)}
                        onChange={(e) => setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                        className="h-8"
                      />
                    )}
                  </div>
                ) : (
                  league.is_free ? (
                    <Badge variant="outline" className="text-green-600">Free</Badge>
                  ) : (
                    <p className="text-2xl font-bold">${(league.price_cents / 100).toFixed(2)}</p>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Competition Thumbnail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Competition Thumbnail
              </CardTitle>
              <CardDescription>
                This image appears as a thumbnail on competition cards in the mobile app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    bucket="league-images"
                    folder="thumbnails"
                    maxSizeMB={2}
                    aspectRatio="thumbnail"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 128x128 pixels (square)
                  </p>
                </div>
              ) : league.image_url ? (
                <div className="relative aspect-square w-32 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={league.image_url}
                    alt={`${league.name} thumbnail`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-square w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-xs">No image</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(startDate, "MMMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(endDate, "MMMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Select
                        value={formData.city_id}
                        onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                      >
                        <SelectTrigger id="city">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}, {city.state_province || city.country_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Venue</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Tennis Club Name"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-medium">{league.location || "Not specified"}</p>
                    </div>
                    {league.city && (
                      <div>
                        <p className="text-sm text-muted-foreground">City</p>
                        <p className="font-medium">
                          {league.city.name}, {league.city.state_province || league.city.country_code}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Rating Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="min_rating">Minimum Rating</Label>
                      <Input
                        id="min_rating"
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={formData.min_rating}
                        onChange={(e) => setFormData({ ...formData, min_rating: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_rating">Maximum Rating</Label>
                      <Input
                        id="max_rating"
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={formData.max_rating}
                        onChange={(e) => setFormData({ ...formData, max_rating: parseFloat(e.target.value) })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum</p>
                      <p className="font-medium">{league.min_rating || "No minimum"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Maximum</p>
                      <p className="font-medium">{league.max_rating || "No maximum"}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Points System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="points_win">Points for Win</Label>
                      <Input
                        id="points_win"
                        type="number"
                        min="0"
                        value={formData.default_points_win}
                        onChange={(e) => setFormData({ ...formData, default_points_win: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="points_loss">Points for Loss</Label>
                      <Input
                        id="points_loss"
                        type="number"
                        min="0"
                        value={formData.default_points_loss}
                        onChange={(e) => setFormData({ ...formData, default_points_loss: parseInt(e.target.value) })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Win</p>
                      <p className="font-medium">{league.default_points_win} points</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loss</p>
                      <p className="font-medium">{league.default_points_loss} points</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Match Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4" />
                Match Format
              </CardTitle>
              <CardDescription>
                Number of sets required for matches in this competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="match_format">Number of Sets</Label>
                  <Select
                    value={String(formData.match_format?.number_of_sets || 3)}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      match_format: {
                        number_of_sets: parseInt(value) as 1 | 2 | 3 | 5,
                        final_set_tiebreak: value === '2' ? true : undefined
                      }
                    })}
                  >
                    <SelectTrigger id="match_format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Set</SelectItem>
                      <SelectItem value="2">2 Sets + Tiebreak</SelectItem>
                      <SelectItem value="3">3 Sets (Best of 3)</SelectItem>
                      <SelectItem value="5">5 Sets (Best of 5)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.match_format?.number_of_sets === 2 && "If sets are split 1-1, a super tiebreak decides the match"}
                    {formData.match_format?.number_of_sets === 1 && "Quick match format - single set decides the winner"}
                    {formData.match_format?.number_of_sets === 3 && "Standard recreational format - first to win 2 sets"}
                    {formData.match_format?.number_of_sets === 5 && "Professional format - first to win 3 sets"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold">
                    {league.match_format?.number_of_sets || 3} {(league.match_format?.number_of_sets || 3) === 1 ? 'Set' : 'Sets'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(league.match_format?.number_of_sets || 3) === 2 && "2 sets with super tiebreak if split"}
                    {(league.match_format?.number_of_sets || 3) === 1 && "Single set format"}
                    {(league.match_format?.number_of_sets || 3) === 3 && "Best of 3 sets"}
                    {(league.match_format?.number_of_sets || 3) === 5 && "Best of 5 sets"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Club */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Club
              </CardTitle>
              <CardDescription>
                Link this competition to a club. Only club members will see it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="organization_id">Club</Label>
                  <Select
                    value={formData.organization_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, organization_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="organization_id">
                      <SelectValue placeholder="Select club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Open to all)</SelectItem>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}{org.court_id && courtsMap[org.court_id] ? ` (${courtsMap[org.court_id]})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  {league.organization_id ? (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Building2 className="h-3 w-3" />
                      {(() => {
                        const org = organizations.find(o => o.id === league.organization_id)
                        const courtName = org?.court_id ? courtsMap[org.court_id] : null
                        return `${org?.name || "Club"}${courtName ? ` (${courtName})` : ''}`
                      })()}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Open to all players</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_private">Private (Invite Only)</Label>
                    <Switch
                      id="is_private"
                      checked={formData.is_private}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_playoffs">Has Playoffs</Label>
                    <Switch
                      id="has_playoffs"
                      checked={formData.has_playoffs}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_playoffs: checked })}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {league.is_active && <Badge variant="outline">Active</Badge>}
                  {league.is_private && <Badge variant="outline">Private</Badge>}
                  {league.has_playoffs && <Badge variant="outline">Has Playoffs</Badge>}
                  {!league.is_active && !league.is_private && !league.has_playoffs && (
                    <p className="text-sm text-muted-foreground">No special settings</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Standings</CardTitle>
              <CardDescription>
                {players.length} players enrolled in this competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No players enrolled yet
                </div>
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
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((lp, index) => (
                        <TableRow key={lp.id}>
                          <TableCell className="font-medium">
                            {index + 1}
                            {index === 0 && " 🏆"}
                            {index === 1 && " 🥈"}
                            {index === 2 && " 🥉"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {lp.player?.first_name} {lp.player?.last_name}
                              </p>
                              {lp.player?.country_code && (
                                <p className="text-xs text-muted-foreground">{lp.player.country_code}</p>
                              )}
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
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setPlayerToRemove(lp)}
                              title="Remove player from competition"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ladder Tab - Only shown for ladder competitions */}
        {league.competition_type === 'ladder' && (
          <TabsContent value="ladder" className="space-y-4">
            <LadderManagementPanel league={league} />
          </TabsContent>
        )}
      </Tabs>

      {/* Remove Player Confirmation Dialog */}
      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player from Competition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {playerToRemove?.player?.first_name} {playerToRemove?.player?.last_name}
              </span>{" "}
              from this competition? This will delete their standings, points, and match history within this competition.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePlayer}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Player"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}