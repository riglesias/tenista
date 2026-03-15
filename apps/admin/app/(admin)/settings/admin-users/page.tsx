import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AdminUsersClient } from "@/components/settings/admin-users-client"

async function getAdminUsers() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Failed to fetch admin users:", error)
    return []
  }

  return data || []
}

export default async function AdminUsersPage() {
  const adminUsers = await getAdminUsers()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Users</h2>
        <p className="text-muted-foreground">
          Manage who has access to the admin panel and their roles.
        </p>
      </div>

      <AdminUsersClient adminUsers={adminUsers} />
    </div>
  )
}
