"use client"

import { useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LadderChallengeWithPlayers,
  adminCancelChallenge,
  adminForceWalkover
} from "@/lib/actions/ladder-admin.actions"
import { ChallengeStatus } from "@/types/database.types"
import { toast } from "sonner"
import {
  MoreHorizontal,
  RefreshCw,
  Loader2,
  X,
  Trophy,
  Clock,
  ArrowRight,
  AlertTriangle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface LadderChallengesTableProps {
  challenges: LadderChallengeWithPlayers[]
  leagueId: string
  onRefresh: () => void
}

const statusColors: Record<ChallengeStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-gray-100 text-gray-800 border-gray-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

export function LadderChallengesTable({ challenges, leagueId, onRefresh }: LadderChallengesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [walkoverDialogOpen, setWalkoverDialogOpen] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<LadderChallengeWithPlayers | null>(null)
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter challenges by status
  const filteredChallenges = statusFilter === "all"
    ? challenges
    : challenges.filter(c => c.status === statusFilter)

  const columns: ColumnDef<LadderChallengeWithPlayers>[] = [
    {
      accessorKey: "challenger_player",
      header: "Challenger",
      cell: ({ row }) => {
        const player = row.original.challenger_player
        const position = row.original.challenger_position
        if (!player) return <span className="text-muted-foreground">Unknown</span>

        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              #{position}
            </div>
            <div>
              <div className="font-medium">{player.first_name} {player.last_name}</div>
              <div className="text-xs text-muted-foreground">
                Rating: {player.rating?.toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      id: "arrow",
      cell: () => (
        <div className="flex justify-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
    },
    {
      accessorKey: "challenged_player",
      header: "Challenged",
      cell: ({ row }) => {
        const player = row.original.challenged_player
        const position = row.original.challenged_position
        if (!player) return <span className="text-muted-foreground">Unknown</span>

        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              #{position}
            </div>
            <div>
              <div className="font-medium">{player.first_name} {player.last_name}</div>
              <div className="text-xs text-muted-foreground">
                Rating: {player.rating?.toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as ChallengeStatus
        return (
          <Badge variant="outline" className={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "acceptance_deadline",
      header: "Deadline",
      cell: ({ row }) => {
        const status = row.original.status
        const acceptanceDeadline = row.original.acceptance_deadline
        const matchDeadline = row.original.match_deadline

        // Show relevant deadline based on status
        if (status === 'pending' && acceptanceDeadline) {
          const deadline = new Date(acceptanceDeadline)
          const isExpired = deadline < new Date()
          return (
            <div className="flex items-center gap-1">
              <Clock className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className={isExpired ? 'text-red-500' : ''}>
                {isExpired ? 'Expired' : formatDistanceToNow(deadline, { addSuffix: true })}
              </span>
            </div>
          )
        }

        if (status === 'accepted' && matchDeadline) {
          const deadline = new Date(matchDeadline)
          const isExpired = deadline < new Date()
          return (
            <div className="flex items-center gap-1">
              <Clock className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={isExpired ? 'text-red-500' : ''}>
                Match: {isExpired ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: true })}
              </span>
            </div>
          )
        }

        if (status === 'completed' && row.original.completed_at) {
          return (
            <span className="text-muted-foreground text-sm">
              Completed {formatDistanceToNow(new Date(row.original.completed_at), { addSuffix: true })}
            </span>
          )
        }

        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: "winner_player_id",
      header: "Winner",
      cell: ({ row }) => {
        const winnerId = row.original.winner_player_id
        if (!winnerId) return <span className="text-muted-foreground">-</span>

        const isChallenger = winnerId === row.original.challenger_player_id
        const winner = isChallenger
          ? row.original.challenger_player
          : row.original.challenged_player

        return (
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">
              {winner?.first_name} {winner?.last_name?.[0]}.
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const challenge = row.original
        const canCancel = challenge.status === 'pending' || challenge.status === 'accepted'
        const canForceWalkover = challenge.status === 'pending' || challenge.status === 'accepted'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {canCancel && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedChallenge(challenge)
                    setCancelDialogOpen(true)
                  }}
                  className="text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Challenge
                </DropdownMenuItem>
              )}
              {canForceWalkover && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedChallenge(challenge)
                    setSelectedWinner(null)
                    setWalkoverDialogOpen(true)
                  }}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Force Walkover
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(challenge.id)
                  toast.success('Challenge ID copied')
                }}
              >
                Copy Challenge ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredChallenges,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const handleCancel = async () => {
    if (!selectedChallenge) return

    setIsProcessing(true)
    try {
      const { error } = await adminCancelChallenge(selectedChallenge.id)

      if (error) {
        toast.error(error)
      } else {
        toast.success('Challenge cancelled')
        setCancelDialogOpen(false)
        onRefresh()
      }
    } catch (error) {
      toast.error('Failed to cancel challenge')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleForceWalkover = async () => {
    if (!selectedChallenge || !selectedWinner) return

    setIsProcessing(true)
    try {
      const { error } = await adminForceWalkover(selectedChallenge.id, selectedWinner)

      if (error) {
        toast.error(error)
      } else {
        toast.success('Walkover recorded')
        setWalkoverDialogOpen(false)
        onRefresh()
      }
    } catch (error) {
      toast.error('Failed to record walkover')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No challenges found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {filteredChallenges.length} challenges
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Cancel Challenge Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this challenge between{' '}
              <strong>{selectedChallenge?.challenger_player?.first_name} {selectedChallenge?.challenger_player?.last_name}</strong>
              {' '}and{' '}
              <strong>{selectedChallenge?.challenged_player?.first_name} {selectedChallenge?.challenged_player?.last_name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Walkover Dialog */}
      <Dialog open={walkoverDialogOpen} onOpenChange={setWalkoverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Force Walkover
            </DialogTitle>
            <DialogDescription>
              Award a walkover victory for this challenge. Select the winner below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              A walkover will complete this challenge and update ladder positions accordingly.
            </p>
            <div className="space-y-2">
              <Button
                variant={selectedWinner === selectedChallenge?.challenger_player_id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedWinner(selectedChallenge?.challenger_player_id || null)}
              >
                <Trophy className="mr-2 h-4 w-4" />
                {selectedChallenge?.challenger_player?.first_name} {selectedChallenge?.challenger_player?.last_name}
                <span className="text-muted-foreground ml-2">(Challenger - #{selectedChallenge?.challenger_position})</span>
              </Button>
              <Button
                variant={selectedWinner === selectedChallenge?.challenged_player_id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedWinner(selectedChallenge?.challenged_player_id || null)}
              >
                <Trophy className="mr-2 h-4 w-4" />
                {selectedChallenge?.challenged_player?.first_name} {selectedChallenge?.challenged_player?.last_name}
                <span className="text-muted-foreground ml-2">(Defender - #{selectedChallenge?.challenged_position})</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalkoverDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleForceWalkover}
              disabled={isProcessing || !selectedWinner}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Award Walkover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
