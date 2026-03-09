"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Organization, Court } from "@/types/database.types"
import { ImageUpload } from "@/components/ui/image-upload"
import { Loader2 } from "lucide-react"

interface ClubDialogProps {
  club: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  courts?: Court[]
}

export function ClubDialog({ club, open, onOpenChange, onSuccess, courts = [] }: ClubDialogProps) {
  const isEditing = !!club
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    join_code: "",
    image_url: "",
    court_id: "",
  })

  useEffect(() => {
    if (open) {
      if (club) {
        setFormData({
          name: club.name,
          join_code: club.join_code || "",
          image_url: club.image_url || "",
          court_id: club.court_id || "",
        })
      } else {
        setFormData({ name: "", join_code: "", image_url: "", court_id: "" })
      }
    }
  }, [open, club])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Club name is required")
      return
    }

    setIsSaving(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        join_code: formData.join_code.trim().toUpperCase() || null,
        image_url: formData.image_url.trim() || null,
        court_id: formData.court_id || null,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('organizations')
          .update(payload)
          .eq('id', club.id)
        if (error) throw error
        toast.success("Club updated successfully")
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert(payload)
        if (error) throw error
        toast.success("Club created successfully")
      }

      onSuccess()
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} club: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Club" : "Add Club"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the club details below."
              : "Create a new club. Members can join using the invite code."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Tennis Club Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="join_code">Join Code</Label>
            <Input
              id="join_code"
              value={formData.join_code}
              onChange={(e) => setFormData({ ...formData, join_code: e.target.value.toUpperCase() })}
              placeholder="e.g. CLUB2026"
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Optional. Members use this code to join the club.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Club Image</Label>
            <ImageUpload
              value={formData.image_url || null}
              onChange={(url) => setFormData({ ...formData, image_url: url || "" })}
              bucket="club-images"
              folder="logos"
              maxSizeMB={2}
              aspectRatio="thumbnail"
              disabled={isSaving}
            />
          </div>

          {courts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="court_id">Home Court</Label>
              <Select
                value={formData.court_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, court_id: value === "none" ? "" : value })}
              >
                <SelectTrigger id="court_id">
                  <SelectValue placeholder="Select a court" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}{court.city ? ` (${court.city})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this club to a court. Members who join will have this as their homecourt.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isEditing ? "Save Changes" : "Create Club"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
