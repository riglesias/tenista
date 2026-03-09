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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Organization, OrganizationPlayer, League, Court } from "@/types/database.types"
import { format } from "date-fns"
import { toast } from "sonner"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Building2, ArrowLeft, Edit2, Save, X, Loader2, UserMinus, Trophy, KeyRound, MapPin
} from "lucide-react"

interface ClubDetailClientProps {
  club: Organization
  members: OrganizationPlayer[]
  competitions: League[]
  court?: Court | null
  courts?: Court[]
}

export function ClubDetailClient({ club, members, competitions, court = null, courts = [] }: ClubDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<OrganizationPlayer | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [formData, setFormData] = useState({
    name: club.name,
    join_code: club.join_code || "",
    image_url: club.image_url || "",
    court_id: club.court_id || "",
  })

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Club name is required")
      return
    }

    setIsSaving(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name.trim(),
          join_code: formData.join_code.trim().toUpperCase() || null,
          image_url: formData.image_url.trim() || null,
          court_id: formData.court_id || null,
        })
        .eq('id', club.id)

      if (error) {
        toast.error(`Failed to update club: ${error.message}`)
      } else {
        toast.success('Club updated successfully')
        setIsEditing(false)
        router.refresh()
      }
    } catch (error) {
      toast.error('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: club.name,
      join_code: club.join_code || "",
      image_url: club.image_url || "",
      court_id: club.court_id || "",
    })
    setIsEditing(false)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setIsRemoving(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from('organization_players')
        .delete()
        .eq('organization_id', memberToRemove.organization_id)
        .eq('player_id', memberToRemove.player_id)

      if (error) {
        toast.error(`Failed to remove member: ${error.message}`)
      } else {
        toast.success(`${memberToRemove.player?.first_name} ${memberToRemove.player?.last_name} has been removed`)
        setMemberToRemove(null)
        router.refresh()
      }
    } catch (error) {
      toast.error('An error occurred while removing the member')
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
            onClick={() => router.push('/clubs')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            {club.image_url ? (
              <img src={club.image_url} alt={club.name} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-3xl font-bold h-auto py-1"
                  />
                ) : (
                  club.name
                )}
              </h2>
              {club.join_code && (
                <Badge variant="secondary" className="font-mono mt-1">{club.join_code}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
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
              Edit Club
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="competitions">Competitions ({competitions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Club Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{club.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Image</p>
                  {isEditing ? (
                    <ImageUpload
                      value={formData.image_url || null}
                      onChange={(url) => setFormData({ ...formData, image_url: url || "" })}
                      bucket="club-images"
                      folder="logos"
                      maxSizeMB={2}
                      aspectRatio="thumbnail"
                      disabled={isSaving}
                    />
                  ) : club.image_url ? (
                    <img src={club.image_url} alt={club.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <p className="text-muted-foreground">No image</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(club.created_at), "MMMM d, yyyy")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Join Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="join_code">Invite Code</Label>
                    <Input
                      id="join_code"
                      value={formData.join_code}
                      onChange={(e) => setFormData({ ...formData, join_code: e.target.value.toUpperCase() })}
                      placeholder="e.g. CLUB2026"
                      className="font-mono uppercase"
                    />
                    <p className="text-xs text-muted-foreground">
                      Members use this code to join the club in the app.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Code</p>
                    {club.join_code ? (
                      <Badge variant="secondary" className="text-lg font-mono px-3 py-1">
                        {club.join_code}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground">No join code set</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Home Court */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Home Court
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="court_id">Court</Label>
                  <Select
                    value={formData.court_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, court_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="court_id">
                      <SelectValue placeholder="Select a court" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {courts.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.city ? ` (${c.city})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Members who join will have this court set as their homecourt.
                  </p>
                </div>
              ) : (
                <div>
                  {court ? (
                    <div>
                      <p className="font-medium">{court.name}</p>
                      {court.city && (
                        <p className="text-sm text-muted-foreground">{court.city}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No court linked</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{members.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Competitions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{competitions.length}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Club Members</CardTitle>
              <CardDescription>
                {members.length} members in this club
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No members yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.player_id}>
                          <TableCell>
                            <p className="font-medium">
                              {member.player?.first_name} {member.player?.last_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.player?.rating || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(member.added_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setMemberToRemove(member)}
                              title="Remove member"
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

        <TabsContent value="competitions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Club Competitions</CardTitle>
              <CardDescription>
                {competitions.length} competitions linked to this club
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competitions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No competitions linked yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitions.map((league) => {
                        const now = new Date()
                        const startDate = new Date(league.start_date)
                        const endDate = new Date(league.end_date)
                        let status = "upcoming"
                        if (now > endDate) status = "completed"
                        else if (now >= startDate && now <= endDate) status = "active"

                        return (
                          <TableRow key={league.id}>
                            <TableCell>
                              <button
                                onClick={() => router.push(`/leagues/${league.id}`)}
                                className="font-medium text-primary hover:underline text-left"
                              >
                                {league.name}
                              </button>
                            </TableCell>
                            <TableCell>
                              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={status === "active" ? "default" : status === "upcoming" ? "secondary" : "outline"}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/leagues/${league.id}`)}
                              >
                                <Trophy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member from Club</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {memberToRemove?.player?.first_name} {memberToRemove?.player?.last_name}
              </span>{" "}
              from this club? They will need to use the join code to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
