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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, Edit, Trash2, Power, MapPin, Sun, Moon } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Court {
  id: string
  name: string
  city_id: string
  city_name?: string
  address: string | null
  court_type: string | null
  surface_type: string | null
  number_of_courts: number | null
  has_lights: boolean | null
  is_public: boolean | null
  contact_info: any
  amenities: string[] | null
  operating_hours: any
  pricing: any
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

interface CourtsTableProps {
  courts: Court[]
  onAdd?: () => void
  onView?: (court: Court) => void
  onEdit?: (court: Court) => void
  onDelete?: (court: Court) => void
  onToggleActive?: (court: Court) => void
  onFilteredDataChange?: (filteredCourts: Court[]) => void
}

export function CourtsTable({ courts, onAdd, onView, onEdit, onDelete, onToggleActive, onFilteredDataChange }: CourtsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    address: false,
    amenities: false,
  })
  const [cityFilter, setCityFilter] = React.useState<string>("all")

  // Get unique cities for filter dropdown
  const cities = React.useMemo(() => {
    const uniqueCities = [...new Set(courts.map(c => c.city_name).filter(Boolean))]
    return uniqueCities.sort()
  }, [courts])

  const columns: ColumnDef<Court>[] = [
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
        return (
          <span className="text-xs font-medium">{row.getValue("name")}</span>
        )
      },
    },
    {
      accessorKey: "city_name",
      header: "City",
      cell: ({ row }) => <span className="text-xs">{row.getValue("city_name") || "Unknown"}</span>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <span className="text-xs">{row.getValue("address") || "-"}</span>,
    },
    {
      accessorKey: "court_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("court_type") as string
        return type ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
            {type}
          </Badge>
        ) : (
          <span className="text-xs">-</span>
        )
      },
    },
    {
      accessorKey: "surface_type",
      header: "Surface",
      cell: ({ row }) => {
        const surface = row.getValue("surface_type") as string
        return surface ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
            {surface}
          </Badge>
        ) : (
          <span className="text-xs">-</span>
        )
      },
    },
    {
      accessorKey: "number_of_courts",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Courts
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const count = row.getValue("number_of_courts") as number
        return (
          <div className="text-center text-xs font-medium">
            {count || 1}
          </div>
        )
      },
    },
    {
      id: "features",
      header: "Features",
      cell: ({ row }) => {
        const court = row.original
        return (
          <div className="flex items-center gap-2">
            {court.is_public ? (
              <div className="flex items-center" title="Public court">
                <Sun className="h-3 w-3 text-blue-600" />
              </div>
            ) : (
              <div className="flex items-center" title="Private court">
                <Badge variant="outline" className="text-[10px] px-1 py-0">Private</Badge>
              </div>
            )}
            {court.has_lights && (
              <div className="flex items-center" title="Has lights">
                <Moon className="h-3 w-3 text-yellow-600" />
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "amenities",
      header: "Amenities",
      cell: ({ row }) => {
        const amenities = row.getValue("amenities") as string[]
        if (!amenities || amenities.length === 0) return <span className="text-xs">-</span>
        return (
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            {amenities.slice(0, 2).map((amenity, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">
                {amenity}
              </Badge>
            ))}
            {amenities.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                +{amenities.length - 2}
              </Badge>
            )}
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
          <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const court = row.original

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
                onClick={() => navigator.clipboard.writeText(court.id)}
              >
                Copy court ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onView && (
                <DropdownMenuItem onClick={() => onView(court)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(court)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit court
                </DropdownMenuItem>
              )}
              {onToggleActive && (
                <DropdownMenuItem onClick={() => onToggleActive(court)}>
                  <Power className="mr-2 h-4 w-4" />
                  {court.is_active ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(court)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete court
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Filter courts by city
  const filteredCourts = React.useMemo(() => {
    if (cityFilter === "all") return courts
    return courts.filter(court => court.city_name === cityFilter)
  }, [courts, cityFilter])

  const table = useReactTable({
    data: filteredCourts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  // Notify parent of filtered data changes
  React.useEffect(() => {
    if (onFilteredDataChange) {
      const filtered = table.getFilteredRowModel().rows.map(row => row.original)
      onFilteredDataChange(filtered)
    }
  }, [cityFilter, columnFilters, sorting]) // Only trigger on actual filter/sort changes

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-xs"
        />
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
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
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="ml-auto">
            <MapPin className="mr-2 h-4 w-4" />
            Add Court
          </Button>
        )}
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
          {table.getFilteredRowModel().rows.length} court(s) found
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