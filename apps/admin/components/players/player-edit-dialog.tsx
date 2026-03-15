"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { format } from "date-fns"

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

interface PlayerEditDialogProps {
  player: Player | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PlayerEditDialog({ player, open, onOpenChange, onSuccess }: PlayerEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    rating: 3.0,
    is_active: true,
  })

  useEffect(() => {
    if (player) {
      setFormData({
        first_name: player.first_name || "",
        last_name: player.last_name || "",
        rating: player.rating || 3.0,
        is_active: player.is_active !== false,
      })
    }
  }, [player])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name || !formData.last_name) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.rating < 1.0 || formData.rating > 7.0) {
      toast.error("Rating must be between 1.0 and 7.0")
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const { error } = await supabase
        .from('players')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          rating: formData.rating,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', player!.id)

      if (error) throw error
      toast.success("Player updated successfully")
      onSuccess()
    } catch (error: any) {
      toast.error(`Failed to update player: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update player information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              type="number"
              min="1.0"
              max="7.0"
              step="0.5"
              value={formData.rating}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                setFormData({
                  ...formData,
                  rating: isNaN(value) ? 3.0 : value,
                })
              }}
            />
            <p className="text-xs text-muted-foreground">
              Range: 1.0 to 7.0 (step 0.5)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Display-only fields */}
          {player && (
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Player Info (read-only)</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span>{player.email || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">City:</span>{" "}
                  <span>{player.city_name || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Club:</span>{" "}
                  <span>{player.club_name || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>{" "}
                  <span>{format(new Date(player.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
