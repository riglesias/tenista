"use client"

import { useState } from "react"
import { CitiesTable } from "@/components/tables/cities-table"
import { CityDialog } from "@/components/cities/city-dialog"
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
import { City } from "@/types/database.types"

interface CitiesClientProps {
  cities: City[]
}

export function CitiesClient({ cities: initialCities }: CitiesClientProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cityToDelete, setCityToDelete] = useState<City | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleAdd = () => {
    setSelectedCity(null)
    setDialogOpen(true)
  }

  const handleEdit = (city: City) => {
    setSelectedCity(city)
    setDialogOpen(true)
  }

  const handleDelete = (city: City) => {
    if ((city.player_count || 0) > 0) {
      toast.error(`Cannot delete "${city.name}" — it has ${city.player_count} player(s) associated`)
      return
    }
    setCityToDelete(city)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!cityToDelete) return

    setIsDeleting(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityToDelete.id)

      if (error) throw error

      toast.success(`City "${cityToDelete.name}" has been deleted`)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to delete city: ${error.message}`)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCityToDelete(null)
    }
  }

  const handleToggleActive = async (city: City) => {
    const supabase = createBrowserSupabaseClient()
    const newActive = city.is_active === false

    try {
      const { error } = await supabase
        .from('cities')
        .update({ is_active: newActive })
        .eq('id', city.id)

      if (error) throw error

      toast.success(`City "${city.name}" has been ${newActive ? 'activated' : 'deactivated'}`)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to update city: ${error.message}`)
    }
  }

  return (
    <>
      <CitiesTable
        cities={initialCities}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      <CityDialog
        city={selectedCity}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          router.refresh()
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the city &quot;{cityToDelete?.name}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete City"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
