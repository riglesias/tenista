"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { City } from "@/types/database.types"

interface CityDialogProps {
  city: City | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CityDialog({ city, open, onOpenChange, onSuccess }: CityDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    state_province: "",
    country_code: "",
    country_name: "",
    latitude: "",
    longitude: "",
    is_active: true,
  })

  const isEditing = !!city

  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name || "",
        state_province: city.state_province || "",
        country_code: city.country_code || "",
        country_name: city.country_name || "",
        latitude: city.latitude != null ? String(city.latitude) : "",
        longitude: city.longitude != null ? String(city.longitude) : "",
        is_active: city.is_active !== false,
      })
    } else {
      setFormData({
        name: "",
        state_province: "",
        country_code: "",
        country_name: "",
        latitude: "",
        longitude: "",
        is_active: true,
      })
    }
  }, [city])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.country_name || !formData.country_code) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.country_code.length !== 2) {
      toast.error("Country code must be exactly 2 letters")
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()

    const payload = {
      name: formData.name,
      state_province: formData.state_province || null,
      country_code: formData.country_code.toUpperCase(),
      country_name: formData.country_name,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      is_active: formData.is_active,
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('cities')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', city.id)

        if (error) throw error
        toast.success("City updated successfully")
      } else {
        const { error } = await supabase
          .from('cities')
          .insert([payload])

        if (error) throw error
        toast.success("City created successfully")
      }

      onSuccess()
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} city: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit City' : 'Add New City'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update city information' : 'Create a new city location'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">City Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Santiago"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state_province">State / Province</Label>
            <Input
              id="state_province"
              value={formData.state_province}
              onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
              placeholder="e.g. Region Metropolitana"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country_name">Country Name *</Label>
              <Input
                id="country_name"
                value={formData.country_name}
                onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                placeholder="e.g. Chile"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_code">Country Code *</Label>
              <Input
                id="country_code"
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="e.g. CL"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g. -33.4489"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g. -70.6693"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
