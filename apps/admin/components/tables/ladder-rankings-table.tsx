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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LadderRankingWithPlayer, adminAdjustPosition } from "@/lib/actions/ladder-admin.actions"
import { toast } from "sonner"
import { ArrowUp, ArrowDown, MoreHorizontal, RefreshCw, Loader2, Search, ArrowUpDown, Trophy } from "lucide-react"

interface LadderRankingsTableProps {
  rankings: LadderRankingWithPlayer[]
  leagueId: string
  onRefresh: () => void
}

export function LadderRankingsTable({ rankings, leagueId, onRefresh }: LadderRankingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'position', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedRanking, setSelectedRanking] = useState<LadderRankingWithPlayer | null>(null)
  const [newPosition, setNewPosition] = useState<number>(1)
  const [adjustReason, setAdjustReason] = useState("")
  const [isAdjusting, setIsAdjusting] = useState(false)

  const columns: ColumnDef<LadderRankingWithPlayer>[] = [
    {
      accessorKey: "position",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          #
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const position = row.getValue("position") as number
        const previousPosition = row.original.previous_position
        const change = previousPosition ? previousPosition - position : 0

        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg w-8">{position}</span>
            {position <= 3 && (
              <Trophy className={`h-4 w-4 ${
                position === 1 ? 'text-yellow-500' :
                position === 2 ? 'text-gray-400' :
                'text-amber-600'
              }`} />
            )}
            {change !== 0 && (
              <Badge variant={change > 0 ? "default" : "destructive"} className="text-xs">
                {change > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {Math.abs(change)}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "player",
      header: "Player",
      cell: ({ row }) => {
        const player = row.original.player
        if (!player) return <span className="text-muted-foreground">Unknown</span>

        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.first_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium">
                  {player.first_name?.[0]}{player.last_name?.[0]}
                </span>
              )}
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
      filterFn: (row, id, value) => {
        const player = row.original.player
        if (!player) return false
        const fullName = `${player.first_name} ${player.last_name}`.toLowerCase()
        return fullName.includes(value.toLowerCase())
      },
    },
    {
      accessorKey: "last_match_date",
      header: "Last Match",
      cell: ({ row }) => {
        const date = row.getValue("last_match_date") as string | null
        if (!date) return <span className="text-muted-foreground">Never</span>

        const matchDate = new Date(date)
        const daysAgo = Math.floor((Date.now() - matchDate.getTime()) / (1000 * 60 * 60 * 24))

        return (
          <div>
            <div className="text-sm">
              {matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-muted-foreground">
              {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ranking = row.original

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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRanking(ranking)
                  setNewPosition(ranking.position)
                  setAdjustReason("")
                  setAdjustDialogOpen(true)
                }}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Adjust Position
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(ranking.player_id || '')
                  toast.success('Player ID copied')
                }}
              >
                Copy Player ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: rankings,
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
        pageSize: 20,
      },
    },
  })

  const handleAdjustPosition = async () => {
    if (!selectedRanking || !selectedRanking.player_id) return

    setIsAdjusting(true)
    try {
      const { error } = await adminAdjustPosition(
        leagueId,
        selectedRanking.player_id,
        newPosition,
        adjustReason || 'Admin adjustment'
      )

      if (error) {
        toast.error(error)
      } else {
        toast.success('Position adjusted successfully')
        setAdjustDialogOpen(false)
        onRefresh()
      }
    } catch (error) {
      toast.error('Failed to adjust position')
    } finally {
      setIsAdjusting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={(table.getColumn("player")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("player")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[200px]"
          />
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
                  No rankings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {rankings.length} players
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

      {/* Adjust Position Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Position</DialogTitle>
            <DialogDescription>
              Change the ladder position for {selectedRanking?.player?.first_name} {selectedRanking?.player?.last_name}.
              Current position: #{selectedRanking?.position}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPosition">New Position</Label>
              <Input
                id="newPosition"
                type="number"
                min={1}
                max={rankings.length}
                value={newPosition}
                onChange={(e) => setNewPosition(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a position between 1 and {rankings.length}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="e.g., Correcting initial seeding"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustPosition} disabled={isAdjusting}>
              {isAdjusting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adjust Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
