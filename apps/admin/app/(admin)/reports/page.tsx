import { getMatchReports } from "@/lib/actions/match-reports.actions"
import { ReportsClient } from "@/components/reports/reports-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ReportsPage() {
  const { data: reports, error } = await getMatchReports()

  const pendingCount = reports?.filter(r => r.status === "pending").length ?? 0
  const reviewedCount = reports?.filter(r => r.status === "reviewed").length ?? 0
  const dismissedCount = reports?.filter(r => r.status === "dismissed").length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Match Reports</h2>
        <p className="text-muted-foreground">
          Review match result disputes reported by players
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
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewedCount}</div>
            <p className="text-xs text-muted-foreground">Action taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dismissed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dismissedCount}</div>
            <p className="text-xs text-muted-foreground">No action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            Click on a report to review or dismiss it. Reviewed reports can be linked to match edits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-muted-foreground">Failed to load reports.</p>
          ) : (
            <ReportsClient reports={reports || []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
