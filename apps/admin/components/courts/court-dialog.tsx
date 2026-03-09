"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface Court {
  id: string
  name: string
  city_id: string
  city_name?: string
  address: string | null
  court_type: string | null
  surface_type: string | null
  number_of_courts: number | null
  has_lights: boolean | null
  is_public: boolean | null
  contact_info: any
  amenities: string[] | null
  operating_hours: any
  pricing: any
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

interface CourtDialogProps {
  court: Court | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CourtDialog({ court, open, onOpenChange, onSuccess }: CourtDialogProps) {
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    city_id: "",
    address: "",
    court_type: "outdoor",
    surface_type: "hard",
    number_of_courts: 1,
    has_lights: false,
    is_public: true,
    is_active: true,
  })

  const isEditing = !!court

  useEffect(() => {
    if (court) {
      setFormData({
        name: court.name || "",
        city_id: court.city_id || "",
        address: court.address || "",
        court_type: court.court_type || "outdoor",
        surface_type: court.surface_type || "hard",
        number_of_courts: court.number_of_courts && !isNaN(court.number_of_courts) ? court.number_of_courts : 1,
        has_lights: court.has_lights === true,
        is_public: court.is_public !== false,
        is_active: court.is_active !== false,
      })
    } else {
      setFormData({
        name: "",
        city_id: "",
        address: "",
        court_type: "outdoor",
        surface_type: "hard",
        number_of_courts: 1,
        has_lights: false,
        is_public: true,
        is_active: true,
      })
    }
  }, [court])

  useEffect(() => {
    // Load cities
    const loadCities = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase
        .from('cities')
        .select('id, name')
        .order('name')
      
      if (data) {
        setCities(data)
      }
    }
    loadCities()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.city_id) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('courts')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', court.id)

        if (error) throw error
        toast.success("Court updated successfully")
      } else {
        const { error } = await supabase
          .from('courts')
          .insert([{
            name: formData.name,
            city_id: formData.city_id,
            address: formData.address || null,
            court_type: formData.court_type,
            surface_type: formData.surface_type,
            number_of_courts: formData.number_of_courts,
            has_lights: formData.has_lights,
            is_public: formData.is_public,
            is_active: formData.is_active,
            contact_info: {},
            amenities: [],
            operating_hours: {},
            pricing: {}
          }])

        if (error) throw error
        toast.success("Court created successfully")
      }

      onSuccess()
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} court: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Court' : 'Add New Court'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update court information' : 'Create a new tennis court location'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Court Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Select
                value={formData.city_id}
                onValueChange={(value) => setFormData({ ...formData, city_id: value })}
              >
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="court_type">Court Type</Label>
              <Select
                value={formData.court_type}
                onValueChange={(value) => setFormData({ ...formData, court_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="covered">Covered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface_type">Surface Type</Label>
              <Select
                value={formData.surface_type}
                onValueChange={(value) => setFormData({ ...formData, surface_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hard">Hard Court</SelectItem>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="grass">Grass</SelectItem>
                  <SelectItem value="carpet">Carpet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_courts">Number of Courts</Label>
              <Input
                id="number_of_courts"
                type="number"
                min="1"
                value={formData.number_of_courts || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setFormData({ 
                    ...formData, 
                    number_of_courts: isNaN(value) ? 1 : value 
                  })
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="has_lights">Has Lights</Label>
              <Switch
                id="has_lights"
                checked={formData.has_lights}
                onCheckedChange={(checked) => setFormData({ ...formData, has_lights: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_public">Public Court</Label>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
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