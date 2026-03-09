import { getRatingRequests } from "@/lib/actions/rating-requests.actions"
import { RatingRequestsClient } from "@/components/rating-requests/rating-requests-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function RatingRequestsPage() {
  const { data: requests, error } = await getRatingRequests()

  const pendingCount = requests?.filter(r => r.status === "pending").length ?? 0
  const approvedCount = requests?.filter(r => r.status === "approved").length ?? 0
  const rejectedCount = requests?.filter(r => r.status === "rejected").length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rating Requests</h2>
        <p className="text-muted-foreground">
          Review player rating change requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Rating updated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">No action taken</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Approve to update the player&apos;s rating, or reject to leave it unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-muted-foreground">Failed to load rating requests.</p>
          ) : (
            <RatingRequestsClient requests={requests || []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
