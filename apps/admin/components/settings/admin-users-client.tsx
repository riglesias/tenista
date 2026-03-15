"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, MoreHorizontal, Pencil, Trash2, Shield } from "lucide-react"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Card, CardContent } from "@/components/ui/card"

interface AdminUser {
  id: string
  role: string
  permissions: any
  last_login: string | null
  created_at: string
}

interface AdminUsersClientProps {
  adminUsers: AdminUser[]
}

const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "league_admin", label: "League Admin" },
  { value: "support", label: "Support" },
] as const

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "super_admin":
      return "default"
    case "league_admin":
      return "secondary"
    case "support":
      return "outline"
    default:
      return "outline"
  }
}

function formatRole(role: string): string {
  return ROLES.find((r) => r.value === role)?.label || role
}

export function AdminUsersClient({ adminUsers }: AdminUsersClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    userId: "",
    role: "league_admin",
  })

  const openAddDialog = () => {
    setEditingUser(null)
    setFormData({ userId: "", role: "league_admin" })
    setDialogOpen(true)
  }

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({ userId: user.id, role: user.role })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.userId.trim()) {
      toast.error("Please enter a user ID")
      return
    }

    // Basic UUID format check
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(formData.userId.trim())) {
      toast.error("Please enter a valid UUID format")
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()

    try {
      if (editingUser) {
        const { error } = await supabase
          .from("admin_users")
          .update({ role: formData.role })
          .eq("id", editingUser.id)

        if (error) throw error
        toast.success("Admin user role updated")
      } else {
        const { error } = await supabase.from("admin_users").insert([
          {
            id: formData.userId.trim(),
            role: formData.role,
            permissions: {},
          },
        ])

        if (error) throw error
        toast.success("Admin user added")
      }

      setDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      const action = editingUser ? "update" : "add"
      toast.error(`Failed to ${action} admin user: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return

    setLoading(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", deleteUser.id)

      if (error) throw error
      toast.success("Admin user removed")
      setDeleteUser(null)
      router.refresh()
    } catch (error: any) {
      toast.error(`Failed to remove admin user: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {adminUsers.length} admin user{adminUsers.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {adminUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No admin users found.</p>
            <Button onClick={openAddDialog} variant="outline" className="mt-4">
              Add your first admin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">
                    {user.id.slice(0, 8)}&hellip;
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.last_login
                      ? format(new Date(user.last_login), "MMM d, yyyy HH:mm")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Admin User" : "Add Admin User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update this admin user's role."
                : "Add a new admin user by entering their auth user UUID."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID (UUID)</Label>
              <Input
                id="userId"
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                disabled={!!editingUser}
                className="font-mono text-sm"
              />
              {!editingUser && (
                <p className="text-xs text-muted-foreground">
                  The user must already exist in Supabase Auth.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingUser
                    ? "Update"
                    : "Add Admin"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this admin user? They will lose all
              access to the admin panel. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
