"use client"

import { useState } from "react"
import { CourtsTable } from "@/components/tables/courts-table"
import { CourtDialog } from "@/components/courts/court-dialog"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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

interface CourtsClientProps {
  courts: Court[]
  onFilteredDataChange?: (stats: {
    total: number
    publicCourts: number
    privateCourts: number
    withLights: number
  }) => void
}

export function CourtsClient({ courts: initialCourts, onFilteredDataChange }: CourtsClientProps) {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courtToDelete, setCourtToDelete] = useState<Court | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filteredCourts, setFilteredCourts] = useState(initialCourts)
  const router = useRouter()

  const handleFilteredDataChange = (courts: Court[]) => {
    setFilteredCourts(courts)
    if (onFilteredDataChange) {
      const activeCourts = courts.filter(c => c.is_active)
      onFilteredDataChange({
        total: activeCourts.length,
        publicCourts: courts.filter(c => c.is_public).length,
        privateCourts: courts.filter(c => !c.is_public).length,
        withLights: courts.filter(c => c.has_lights).length
      })
    }
  }

  const handleAdd = () => {
    setSelectedCourt(null)
    setDialogOpen(true)
  }

  const handleEdit = (court: Court) => {
    setSelectedCourt(court)
    setDialogOpen(true)
  }

  const handleView = (court: Court) => {
    setSelectedCourt(court)
    setDialogOpen(true)
  }

  const handleDelete = (court: Court) => {
    setCourtToDelete(court)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!courtToDelete) return

    setIsDeleting(true)
    const supabase = createBrowserSupabaseClient()

    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('courts')
        .update({ 
          deleted_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', courtToDelete.id)

      if (error) throw error

      toast.success(`Court "${courtToDelete.name}" has been deleted`)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to delete court: ${error.message}`)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCourtToDelete(null)
    }
  }

  const handleToggleActive = async (court: Court) => {
    const supabase = createBrowserSupabaseClient()

    try {
      const { error } = await supabase
        .from('courts')
        .update({ is_active: !court.is_active })
        .eq('id', court.id)

      if (error) throw error

      toast.success(`Court "${court.name}" has been ${!court.is_active ? 'activated' : 'deactivated'}`)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to update court: ${error.message}`)
    }
  }

  return (
    <>
      <CourtsTable 
        courts={initialCourts} 
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onFilteredDataChange={handleFilteredDataChange}
      />

      {/* Add/Edit Court Dialog */}
      <CourtDialog
        court={selectedCourt}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          router.refresh()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the court "{courtToDelete?.name}". 
              The court will be marked as deleted and won't appear in the app, 
              but the data will be preserved for historical records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Court"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}