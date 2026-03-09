"use client"

import { useState } from "react"
import {
  MatchReportWithDetails,
  reviewReport,
  dismissReport,
} from "@/lib/actions/match-reports.actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ReportsClientProps {
  reports: MatchReportWithDetails[]
}

export function ReportsClient({ reports }: ReportsClientProps) {
  const router = useRouter()
  const [selectedReport, setSelectedReport] = useState<MatchReportWithDetails | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState<"review" | "dismiss">("review")
  const [adminNotes, setAdminNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed" | "dismissed">("all")

  const filteredReports = statusFilter === "all"
    ? reports
    : reports.filter(r => r.status === statusFilter)

  const openDialog = (report: MatchReportWithDetails, action: "review" | "dismiss") => {
    setSelectedReport(report)
    setDialogAction(action)
    setAdminNotes("")
    setShowDialog(true)
  }

  const handleAction = async () => {
    if (!selectedReport) return
    setProcessing(true)

    try {
      const result = dialogAction === "review"
        ? await reviewReport(selectedReport.id, adminNotes)
        : await dismissReport(selectedReport.id, adminNotes)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(dialogAction === "review" ? "Report reviewed" : "Report dismissed")
        setShowDialog(false)
        router.refresh()
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setProcessing(false)
    }
  }

  const formatPlayerName = (player: { first_name: string; last_name: string } | null) => {
    if (!player) return "Unknown"
    return `${player.first_name} ${player.last_name}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">Pending</Badge>
      case "reviewed":
        return <Badge variant="default">Reviewed</Badge>
      case "dismissed":
        return <Badge variant="secondary">Dismissed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatScores = (scores: any) => {
    if (!scores || !Array.isArray(scores)) return "-"
    return scores.map((s: any) => `${s.player1}-${s.player2}`).join(", ")
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No reports</h3>
        <p className="text-sm text-muted-foreground">
          No match result disputes have been reported yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "reviewed", "dismissed"] as const).map((filter) => (
          <Button
            key={filter}
            variant={statusFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter === "pending" && reports.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                {reports.filter(r => r.status === "pending").length}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(report.created_at)}
                </TableCell>
                <TableCell className="text-sm">
                  {report.player_match ? (
                    <div>
                      <span className="font-medium">
                        {formatPlayerName(report.player_match.player1)}
                      </span>
                      <span className="text-muted-foreground"> vs </span>
                      <span className="font-medium">
                        {formatPlayerName(report.player_match.player2)}
                      </span>
                      {report.player_match.ladder_challenge_id && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-600">Ladder match</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unknown match</span>
                  )}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {report.player_match ? formatScores(report.player_match.scores) : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {formatPlayerName(report.reporter)}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate" title={report.reason}>
                  {report.reason}
                </TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell className="text-right">
                  {report.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(report, "review")}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(report, "dismiss")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {report.admin_notes ? report.admin_notes.slice(0, 40) + (report.admin_notes.length > 40 ? "..." : "") : "No notes"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Review/Dismiss Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "review" ? "Review Report" : "Dismiss Report"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "review"
                ? "Mark this report as reviewed. You can edit the match result from the Matches page."
                : "Dismiss this report. No action will be taken."}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Match: </span>
                  {selectedReport.player_match
                    ? `${formatPlayerName(selectedReport.player_match.player1)} vs ${formatPlayerName(selectedReport.player_match.player2)}`
                    : "Unknown"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Score: </span>
                  {selectedReport.player_match ? formatScores(selectedReport.player_match.scores) : "-"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Reporter: </span>
                  {formatPlayerName(selectedReport.reporter)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Reason: </span>
                  {selectedReport.reason}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder="Add notes about your decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant={dialogAction === "dismiss" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={processing}
            >
              {processing
                ? "Processing..."
                : dialogAction === "review"
                ? "Mark as Reviewed"
                : "Dismiss Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
