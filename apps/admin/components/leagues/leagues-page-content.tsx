"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Download, Trophy, Users, Calendar, DollarSign, ChevronLeft, ChevronRight, Building2 } from "lucide-react"
import { League, City } from "@/types/database.types"
import { toast } from "sonner"
import { format } from "date-fns"

interface LeagueWithRelations extends League {
  city?: City
  organization?: { id: string; name: string } | null
  current_players?: number
}

interface LeaguesPageContentProps {
  leagues: LeagueWithRelations[]
  cities: City[]
  stats: {
    totalLeagues: number
    activeLeagues: number
    upcomingLeagues: number
    totalCapacity: number
    totalRevenue: number
  }
}

const divisionLabels: Record<string, string> = {
  division_1: "Division 1",
  division_2: "Division 2",
  division_3: "Division 3",
  division_4: "Division 4",
  open: "Open",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

export function LeaguesPageContent({ leagues, cities, stats }: LeaguesPageContentProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("not_completed")
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  // Filter leagues
  const filteredLeagues = leagues.filter(league => {
    // Search filter
    if (searchTerm && !league.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Status filter
    if (statusFilter === "active" && !league.is_active) return false
    if (statusFilter === "inactive" && league.is_active) return false

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date()
      const startDate = new Date(league.start_date)
      const endDate = new Date(league.end_date)
      const isCompleted = now > endDate
      const isActive = now >= startDate && now <= endDate
      const isUpcoming = now < startDate

      if (timeFilter === "not_completed" && isCompleted) return false
      if (timeFilter === "completed" && !isCompleted) return false
      if (timeFilter === "active" && !isActive) return false
      if (timeFilter === "upcoming" && !isUpcoming) return false
    }

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredLeagues.length / pageSize)
  const paginatedLeagues = filteredLeagues.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  )

  const handleCreate = () => {
    router.push("/leagues/new")
  }

  const handleRowClick = (league: LeagueWithRelations) => {
    router.push(`/leagues/${league.id}`)
  }

  const handleExportCSV = () => {
    try {
      const headers = ['Name', 'Division', 'Start Date', 'End Date', 'City', 'Players', 'Max Players', 'Price', 'Status']
      const rows = leagues.map(league => [
        league.name,
        league.division || 'Open',
        league.start_date,
        league.end_date,
        league.city?.name || '',
        league.current_players || 0,
        league.max_players,
        league.is_free ? 'Free' : `$${(league.price_cents / 100).toFixed(2)}`,
        league.is_active ? 'Active' : 'Inactive'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `competitions-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    }
  }

  const getTimeStatus = (league: LeagueWithRelations) => {
    const now = new Date()
    const startDate = new Date(league.start_date)
    const endDate = new Date(league.end_date)

    if (now > endDate) return "completed"
    if (now >= startDate && now <= endDate) return "active"
    return "upcoming"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Competitions</h2>
          <p className="text-sm text-muted-foreground">
            Manage tennis leagues, ladders, and tournaments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Competition
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeagues}</div>
            <p className="text-xs text-muted-foreground">{stats.activeLeagues} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingLeagues}</div>
            <p className="text-xs text-muted-foreground">Starting soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">Player slots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From paid competitions</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Competitions</CardTitle>
          <CardDescription>
            Click on any competition to view details or edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              placeholder="Search competitions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(0)
              }}
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(0) }}>
              <SelectTrigger className="sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={(v) => { setTimeFilter(v); setCurrentPage(0) }}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Time Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_completed">Hide Completed</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeagues.length > 0 ? (
                  paginatedLeagues.map((league) => {
                    const timeStatus = getTimeStatus(league)
                    return (
                      <TableRow
                        key={league.id}
                        onClick={() => handleRowClick(league)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="font-medium">{league.name}</div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {league.city?.name && (
                              <span className="text-xs text-muted-foreground">{league.city.name}</span>
                            )}
                            {league.organization && (
                              <Badge variant="outline" className="text-xs py-0 px-1 gap-0.5">
                                <Building2 className="h-2.5 w-2.5" />
                                {league.organization.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {divisionLabels[league.division] || league.division || "Open"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(league.start_date), "MMM d")} - {format(new Date(league.end_date), "MMM d, yyyy")}
                          </div>
                          <Badge
                            variant={timeStatus === "active" ? "default" : timeStatus === "upcoming" ? "secondary" : "outline"}
                            className="text-xs mt-1"
                          >
                            {timeStatus.charAt(0).toUpperCase() + timeStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{league.current_players || 0}</span>
                          <span className="text-muted-foreground"> / {league.max_players}</span>
                        </TableCell>
                        <TableCell>
                          {league.is_free ? (
                            <Badge variant="outline" className="text-green-600">Free</Badge>
                          ) : (
                            <span>${(league.price_cents / 100).toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={league.is_active ? "default" : "secondary"}>
                            {league.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No competitions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredLeagues.length)} of {filteredLeagues.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
