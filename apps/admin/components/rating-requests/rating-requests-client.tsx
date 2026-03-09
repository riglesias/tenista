"use client"

import { useState } from "react"
import {
  RatingRequestWithDetails,
  approveRatingRequest,
  rejectRatingRequest,
} from "@/lib/actions/rating-requests.actions"
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
import { CheckCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface RatingRequestsClientProps {
  requests: RatingRequestWithDetails[]
}

export function RatingRequestsClient({ requests }: RatingRequestsClientProps) {
  const router = useRouter()
  const [selectedRequest, setSelectedRequest] = useState<RatingRequestWithDetails | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve")
  const [adminNotes, setAdminNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  const filteredRequests = statusFilter === "all"
    ? requests
    : requests.filter(r => r.status === statusFilter)

  const openDialog = (request: RatingRequestWithDetails, action: "approve" | "reject") => {
    setSelectedRequest(request)
    setDialogAction(action)
    setAdminNotes("")
    setShowDialog(true)
  }

  const handleAction = async () => {
    if (!selectedRequest) return

    if (dialogAction === "reject" && !adminNotes.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    setProcessing(true)

    try {
      const result = dialogAction === "approve"
        ? await approveRatingRequest(selectedRequest.id, adminNotes)
        : await rejectRatingRequest(selectedRequest.id, adminNotes)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          dialogAction === "approve"
            ? `Rating updated to ${selectedRequest.requested_rating.toFixed(1)}`
            : "Request rejected"
        )
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

  const formatRating = (rating: number) => {
    return rating > 5.0 ? "+5.0" : rating.toFixed(1)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">Pending</Badge>
      case "approved":
        return <Badge variant="default">Approved</Badge>
      case "rejected":
        return <Badge variant="secondary">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRatingDirection = (current: number, requested: number) => {
    if (requested > current) return "↑"
    if (requested < current) return "↓"
    return "="
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No requests</h3>
        <p className="text-sm text-muted-foreground">
          No rating change requests have been submitted yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((filter) => (
          <Button
            key={filter}
            variant={statusFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter === "pending" && requests.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                {requests.filter(r => r.status === "pending").length}
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
              <TableHead>Player</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(request.created_at)}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatPlayerName(request.player)}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {formatRating(request.current_rating)}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  <span className="font-medium">
                    {getRatingDirection(request.current_rating, request.requested_rating)}{" "}
                    {formatRating(request.requested_rating)}
                  </span>
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate" title={request.reason}>
                  {request.reason}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-right">
                  {request.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(request, "approve")}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(request, "reject")}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {request.admin_notes
                        ? request.admin_notes.slice(0, 40) + (request.admin_notes.length > 40 ? "..." : "")
                        : "No notes"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approve/Reject Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Approve Rating Change" : "Reject Rating Change"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? `This will change ${formatPlayerName(selectedRequest?.player ?? null)}'s rating from ${formatRating(selectedRequest?.current_rating ?? 0)} to ${formatRating(selectedRequest?.requested_rating ?? 0)}.`
                : "Reject this request. The player's rating will remain unchanged."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Player: </span>
                  {formatPlayerName(selectedRequest.player)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Current Rating: </span>
                  {formatRating(selectedRequest.current_rating)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Requested Rating: </span>
                  {formatRating(selectedRequest.requested_rating)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Reason: </span>
                  {selectedRequest.reason}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Admin Notes{dialogAction === "reject" ? " *" : ""}
                </label>
                <Textarea
                  placeholder={
                    dialogAction === "approve"
                      ? "Add optional notes..."
                      : "Explain why this request is being rejected..."
                  }
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
              variant={dialogAction === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={processing}
            >
              {processing
                ? "Processing..."
                : dialogAction === "approve"
                ? "Approve & Update Rating"
                : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
