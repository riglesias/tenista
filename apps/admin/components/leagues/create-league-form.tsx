"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Trophy } from "lucide-react"
import { City, EliminationFormat, MatchFormat, DEFAULT_MATCH_FORMAT } from "@/types/database.types"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { notifyEligiblePlayers } from "@/lib/actions/league-notifications.actions"

interface CreateLeagueFormProps {
  cities: City[]
}

export function CreateLeagueForm({ cities }: CreateLeagueFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate)
    // Set end date to +1 day from start date
    const nextDay = new Date(newStartDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setEndDate(nextDay.toISOString().split('T')[0])
  }
  const [maxPlayers, setMaxPlayers] = useState("16")
  const [cityId, setCityId] = useState("")
  const [division, setDivision] = useState("division_1")
  const [competitionType, setCompetitionType] = useState("round_robin")
  const [participantType, setParticipantType] = useState("singles")
  const [isFree, setIsFree] = useState(true)
  const [priceCents, setPriceCents] = useState(0)
  const [hasPlayoffs, setHasPlayoffs] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [eliminationFormat, setEliminationFormat] = useState<EliminationFormat>("single")
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(DEFAULT_MATCH_FORMAT)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!name.trim()) {
        toast.error("Competition name is required")
        setLoading(false)
        return
      }

      const supabase = createBrowserSupabaseClient()

      // Get current user for organizer_id
      const { data: { user } } = await supabase.auth.getUser()

      const leagueData = {
        name: name.trim(),
        organizer_id: user?.id || "e8ef557a-1582-4123-aacc-dd9b65c250bc",
        start_date: startDate,
        end_date: endDate,
        max_players: parseInt(maxPlayers) || 16,
        city_id: cityId || null,
        division,
        is_active: true,
        is_private: isPrivate,
        is_free: isFree,
        price_cents: isFree ? 0 : priceCents,
        has_playoffs: hasPlayoffs,
        default_points_win: 3,
        default_points_loss: 1,
        competition_type: competitionType,
        participant_type: participantType,
        elimination_format: competitionType === 'elimination' ? eliminationFormat : null,
        match_format: matchFormat,
      }

      const { data: createdLeague, error } = await supabase
        .from('leagues')
        .insert([leagueData])
        .select('id, name, city_id, min_rating, max_rating, is_private, organization_id, start_date, division')
        .single()

      if (error) {
        console.error('Error creating league:', error)
        toast.error(`Failed to create competition: ${error.message}`)
        setLoading(false)
        return
      }

      toast.success("Competition created successfully!")

      // Notify eligible players in the background
      if (createdLeague) {
        notifyEligiblePlayers(createdLeague).then(({ notified }) => {
          if (notified > 0) {
            toast.info(`${notified} player${notified > 1 ? 's' : ''} notified about the new competition`)
          }
        })
      }
      router.push("/leagues")
      router.refresh()
    } catch (error: any) {
      console.error('Error saving league:', error)
      toast.error(`An error occurred: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Create Competition
          </h2>
          <p className="text-sm text-muted-foreground">
            Set up a new tennis league, ladder, or tournament
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Competition Details</CardTitle>
          <CardDescription>
            Fill in the basic information for your competition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Competition Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spring League 2024"
                required
              />
            </div>

            {/* Competition Type and Participant Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="competition_type">Competition Type *</Label>
                <Select value={competitionType} onValueChange={setCompetitionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">
                      <div className="flex flex-col">
                        <span>Round Robin</span>
                        <span className="text-xs text-muted-foreground">Everyone plays everyone</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ladder">
                      <div className="flex flex-col">
                        <span>Ladder</span>
                        <span className="text-xs text-muted-foreground">Challenge-based ranking</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="elimination">
                      <div className="flex flex-col">
                        <span>Elimination</span>
                        <span className="text-xs text-muted-foreground">Bracket tournament</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="swiss">
                      <div className="flex flex-col">
                        <span>Swiss System</span>
                        <span className="text-xs text-muted-foreground">Paired by similar records</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="participant_type">Participant Type *</Label>
                <Select value={participantType} onValueChange={setParticipantType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="doubles">Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Elimination Format - Only shown when competition type is elimination */}
            {competitionType === 'elimination' && (
              <div className="space-y-2">
                <Label htmlFor="elimination_format">Elimination Format *</Label>
                <Select value={eliminationFormat} onValueChange={(value) => setEliminationFormat(value as EliminationFormat)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">
                      <div className="flex flex-col">
                        <span>Single Elimination</span>
                        <span className="text-xs text-muted-foreground">Lose once and you&apos;re out</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="double">
                      <div className="flex flex-col">
                        <span>Double Elimination</span>
                        <span className="text-xs text-muted-foreground">Must lose twice (winner&apos;s + loser&apos;s bracket)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="consolation">
                      <div className="flex flex-col">
                        <span>Consolation Bracket</span>
                        <span className="text-xs text-muted-foreground">Losers compete in a separate bracket</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="feed_in_consolation">
                      <div className="flex flex-col">
                        <span>Feed-in Consolation</span>
                        <span className="text-xs text-muted-foreground">Losers feed into consolation from each round</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Match Format - Number of Sets */}
            <div className="space-y-2">
              <Label htmlFor="match_format">Match Format</Label>
              <Select
                value={String(matchFormat.number_of_sets)}
                onValueChange={(value) => setMatchFormat({
                  ...matchFormat,
                  number_of_sets: parseInt(value) as 1 | 2 | 3 | 5,
                  final_set_tiebreak: value === '2' ? true : undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of sets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex flex-col">
                      <span>1 Set</span>
                      <span className="text-xs text-muted-foreground">Quick match, single set</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex flex-col">
                      <span>2 Sets + Tiebreak</span>
                      <span className="text-xs text-muted-foreground">Super tiebreak if split</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex flex-col">
                      <span>3 Sets (Best of 3)</span>
                      <span className="text-xs text-muted-foreground">Standard recreational format</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="5">
                    <div className="flex flex-col">
                      <span>5 Sets (Best of 5)</span>
                      <span className="text-xs text-muted-foreground">Professional format</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Number of sets required for matches in this competition
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* City and Division */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select value={cityId} onValueChange={setCityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select value={division} onValueChange={setDivision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="division_1">Division 1</SelectItem>
                    <SelectItem value="division_2">Division 2</SelectItem>
                    <SelectItem value="division_3">Division 3</SelectItem>
                    <SelectItem value="division_4">Division 4</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Max Players */}
            <div className="space-y-2">
              <Label htmlFor="max_players">Maximum Players *</Label>
              <Input
                id="max_players"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxPlayers}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  setMaxPlayers(value)
                }}
                onBlur={() => {
                  const num = parseInt(maxPlayers) || 16
                  const clamped = Math.min(128, Math.max(2, num))
                  setMaxPlayers(String(clamped))
                }}
                placeholder="16"
                required
              />
              <p className="text-xs text-muted-foreground">Between 2 and 128 players</p>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Free Competition</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle off to set a price
                  </p>
                </div>
                <Switch
                  checked={isFree}
                  onCheckedChange={setIsFree}
                />
              </div>

              {!isFree && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={(priceCents / 100).toFixed(2)}
                    onChange={(e) => setPriceCents(Math.round(parseFloat(e.target.value) * 100) || 0)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Has Playoffs</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable playoff rounds at the end
                  </p>
                </div>
                <Switch
                  checked={hasPlayoffs}
                  onCheckedChange={setHasPlayoffs}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Private Competition</Label>
                  <p className="text-xs text-muted-foreground">
                    Only invited players can join
                  </p>
                </div>
                <Switch
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Competition
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
