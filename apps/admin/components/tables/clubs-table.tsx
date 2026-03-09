"use client"

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
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, ArrowUpDown, Copy, Eye, Pencil, Trash2, Building2, MapPin } from "lucide-react"
import { Organization } from "@/types/database.types"
import { format } from "date-fns"

interface ClubWithStats extends Organization {
  member_count: number
  competition_count: number
  court_name?: string | null
}

interface ClubsTableProps {
  clubs: ClubWithStats[]
  onAdd: () => void
  onView: (club: ClubWithStats) => void
  onEdit: (club: ClubWithStats) => void
  onDelete: (club: ClubWithStats) => void
}

export function ClubsTable({ clubs, onAdd, onView, onEdit, onDelete }: ClubsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<ClubWithStats>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const imageUrl = row.original.image_url
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "join_code",
      header: "Join Code",
      cell: ({ row }) => {
        const code = row.getValue("join_code") as string | null
        return code ? (
          <Badge variant="secondary" className="font-mono">{code}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        )
      },
    },
    {
      id: "court_name",
      header: "Home Court",
      cell: ({ row }) => {
        const courtName = row.original.court_name
        return courtName ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{courtName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        )
      },
    },
    {
      accessorKey: "member_count",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Members
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-center">{row.getValue("member_count")}</div>,
    },
    {
      accessorKey: "competition_count",
      header: "Competitions",
      cell: ({ row }) => <div className="text-center">{row.getValue("competition_count")}</div>,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM d, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const club = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(club.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(club)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(club)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(club)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: clubs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter clubs..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Club
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                  No clubs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
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
  )
}
