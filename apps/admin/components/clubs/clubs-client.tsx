"use client"

import { useState } from "react"
import { ClubsTable } from "@/components/tables/clubs-table"
import { ClubDialog } from "@/components/clubs/club-dialog"
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
import { Organization, Court } from "@/types/database.types"

interface ClubWithStats extends Organization {
  member_count: number
  competition_count: number
  court_name?: string | null
}

interface ClubsClientProps {
  clubs: ClubWithStats[]
  courts?: Court[]
}

export function ClubsClient({ clubs, courts = [] }: ClubsClientProps) {
  const [selectedClub, setSelectedClub] = useState<ClubWithStats | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clubToDelete, setClubToDelete] = useState<ClubWithStats | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleAdd = () => {
    setSelectedClub(null)
    setDialogOpen(true)
  }

  const handleEdit = (club: ClubWithStats) => {
    setSelectedClub(club)
    setDialogOpen(true)
  }

  const handleView = (club: ClubWithStats) => {
    router.push(`/clubs/${club.id}`)
  }

  const handleDelete = (club: ClubWithStats) => {
    if (club.member_count > 0) {
      toast.error("Cannot delete a club that has members. Remove all members first.")
      return
    }
    if (club.competition_count > 0) {
      toast.error("Cannot delete a club that has competitions. Unlink competitions first.")
      return
    }
    setClubToDelete(club)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!clubToDelete) return

    setIsDeleting(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', clubToDelete.id)

      if (error) throw error

      toast.success(`Club "${clubToDelete.name}" has been deleted`)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to delete club: ${error.message}`)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setClubToDelete(null)
    }
  }

  return (
    <>
      <ClubsTable
        clubs={clubs}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      <ClubDialog
        club={selectedClub}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          router.refresh()
        }}
        courts={courts}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the club &quot;{clubToDelete?.name}&quot;.
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
              {isDeleting ? "Deleting..." : "Delete Club"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
