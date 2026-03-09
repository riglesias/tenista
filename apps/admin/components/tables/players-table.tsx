"use client"

import * as React from "react"
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
import { ArrowUpDown, Building2, ChevronDown, MoreHorizontal, Eye, Edit, UserX, UserCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Player {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  rating: number
  is_active: boolean
  city_name: string | null
  club_name: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

interface PlayersTableProps {
  players: Player[]
  onView?: (player: Player) => void
  onEdit?: (player: Player) => void
  onToggleActive?: (player: Player) => void
}

export function PlayersTable({ players, onView, onEdit, onToggleActive }: PlayersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    phone: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<Player>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const firstName = row.original.first_name || ""
        const lastName = row.original.last_name || ""
        const fullName = `${firstName} ${lastName}`.trim() || "Unknown"
        return (
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center">
              <span className="text-[10px] font-semibold">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </span>
            </div>
            <span className="text-xs font-medium">{fullName}</span>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const nameA = `${rowA.original.first_name || ""} ${rowA.original.last_name || ""}`.trim()
        const nameB = `${rowB.original.first_name || ""} ${rowB.original.last_name || ""}`.trim()
        return nameA.localeCompare(nameB)
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-xs">{row.getValue("email") || "-"}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-xs">{row.getValue("phone") || "-"}</span>,
    },
    {
      accessorKey: "rating",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rating
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number
        return (
          <div className="text-center text-xs font-medium">
            {rating ? rating.toFixed(1) : "0.0"}
          </div>
        )
      },
    },
    {
      accessorKey: "city_name",
      header: "Location",
      cell: ({ row }) => <span className="text-xs">{row.getValue("city_name") || "-"}</span>,
    },
    {
      accessorKey: "club_name",
      header: "Club",
      cell: ({ row }) => {
        const clubName = row.getValue("club_name") as string | null
        if (!clubName) return <span className="text-xs text-muted-foreground">-</span>
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
            <Building2 className="h-2.5 w-2.5" />
            {clubName}
          </Badge>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        const isVerified = row.original.onboarding_completed
        return (
          <div className="flex items-center gap-1">
            <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
              {isActive ? "Active" : "Inactive"}
            </Badge>
            {isVerified && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Verified</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Joined
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return <span className="text-xs">{format(date, "MMM d, yyyy")}</span>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const player = row.original

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
                onClick={() => navigator.clipboard.writeText(player.id)}
              >
                Copy player ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onView && (
                <DropdownMenuItem onClick={() => onView(player)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(player)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit player
                </DropdownMenuItem>
              )}
              {onToggleActive && (
                <DropdownMenuItem onClick={() => onToggleActive(player)}>
                  {player.is_active ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: players,
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
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            const value = event.target.value
            // Filter by full name
            table.getColumn("name")?.setFilterValue(value)
          }}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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