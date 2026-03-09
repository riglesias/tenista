"use client"

import { useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Match, Player, Tournament } from "@/types/database.types"
import { format } from "date-fns"
import { Eye, Edit, MoreHorizontal, ArrowUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MatchWithRelations extends Match {
  player_a?: Player
  player_b?: Player
  winner?: Player
  tournament?: Tournament
  // Additional fields from player_matches table
  player1_id?: string
  player2_id?: string
}

interface MatchesTableProps {
  matches: MatchWithRelations[]
  onEdit: (match: MatchWithRelations) => void
  onView: (match: MatchWithRelations) => void
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  completed: "bg-green-100 text-green-800 hover:bg-green-200", 
  cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
  forfeit: "bg-orange-100 text-orange-800 hover:bg-orange-200",
}

export function MatchesTable({ matches, onEdit, onView }: MatchesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const columns: ColumnDef<MatchWithRelations>[] = [
    {
      id: "players",
      header: "Players",
      cell: ({ row }) => {
        const match = row.original
        const playerAName = match.player_a 
          ? `${match.player_a.first_name} ${match.player_a.last_name}`
          : "TBD"
        const playerBName = match.player_b 
          ? `${match.player_b.first_name} ${match.player_b.last_name}`
          : "TBD"
        
        return (
          <div className="space-y-0.5">
            <div className="text-xs font-medium">{playerAName}</div>
            <div className="text-[10px] text-muted-foreground">vs</div>
            <div className="text-xs font-medium">{playerBName}</div>
          </div>
        )
      },
    },
    {
      id: "score",
      header: "Score",
      cell: ({ row }) => {
        const scores = row.original.scores
        const match = row.original
        
        if (!scores || typeof scores !== 'object') {
          return (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">-</div>
              <div className="text-xs text-muted-foreground">-</div>
            </div>
          )
        }
        
        // Parse scores for each player
        let player1Scores: string[] = []
        let player2Scores: string[] = []
        
        if (Array.isArray(scores)) {
          player1Scores = scores.map(s => String(s.player1 || 0))
          player2Scores = scores.map(s => String(s.player2 || 0))
        }
        
        // Highlight winner's score
        const isPlayer1Winner = match.winner_id === match.player_a_id || match.winner_id === match.player1_id
        const isPlayer2Winner = match.winner_id === match.player_b_id || match.winner_id === match.player2_id
        
        return (
          <div className="space-y-0.5">
            <div className={`font-mono text-xs ${isPlayer1Winner ? 'font-semibold text-green-700' : ''}`}>
              {player1Scores.length > 0 ? player1Scores.join(" ") : "-"}
            </div>
            <div className="border-t border-gray-200"></div>
            <div className={`font-mono text-xs ${isPlayer2Winner ? 'font-semibold text-green-700' : ''}`}>
              {player2Scores.length > 0 ? player2Scores.join(" ") : "-"}
            </div>
          </div>
        )
      },
    },
    {
      id: "tournament",
      accessorFn: (row) => row.tournament?.name || (row as any).game_type || "Practice Match",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const match = row.original as any
        if (match.tournament?.name) {
          return <div className="text-xs font-medium">{match.tournament.name}</div>
        }
        // Handle player_matches data
        const gameType = match.game_type
        const matchType = match.match_type
        return (
          <div className="space-y-0.5">
            <div className="text-xs font-medium capitalize">{gameType || "Practice"}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{matchType || "Singles"}</div>
          </div>
        )
      },
    },
    {
      id: "winner",
      header: "Winner",
      cell: ({ row }) => {
        const match = row.original
        if (!match.winner_id) {
          return <div className="text-muted-foreground">TBD</div>
        }
        
        const winnerName = match.winner 
          ? `${match.winner.first_name} ${match.winner.last_name}`
          : "Unknown"
        
        return <div className="text-xs font-medium text-green-700">{winnerName}</div>
      },
    },
    {
      accessorKey: "round_number",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Round
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {format(new Date(row.getValue<string>("updated_at")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const match = row.original

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
              <DropdownMenuItem onClick={() => onView(match)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(match)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Result
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Filter matches based on status
  const filteredMatches = statusFilter === "all" 
    ? matches 
    : matches.filter(match => match.status === statusFilter)

  const table = useReactTable({
    data: filteredMatches,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Filter tournaments..."
          value={(table.getColumn("tournament")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("tournament")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="forfeit">Forfeit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No matches found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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
    </div>
  )
}