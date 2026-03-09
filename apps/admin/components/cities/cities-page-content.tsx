"use client"

import { useState } from "react"
import { CitiesClient } from "@/components/cities/cities-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Globe, Users, MapPin, EyeOff } from "lucide-react"
import { City } from "@/types/database.types"

interface CitiesPageContentProps {
  cities: City[]
  initialStats: {
    totalCities: number
    countries: number
    totalPlayers: number
    inactive: number
  }
}

export function CitiesPageContent({ cities, initialStats }: CitiesPageContentProps) {
  const [stats, setStats] = useState(initialStats)

  const handleExportCSV = () => {
    const headers = ["Name", "State/Province", "Country", "Country Code", "Players", "Active", "Latitude", "Longitude"]
    const rows = cities.map(c => [
      c.name,
      c.state_province || "",
      c.country_name,
      c.country_code,
      c.player_count || 0,
      c.is_active !== false ? "Yes" : "No",
      c.latitude || "",
      c.longitude || "",
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cities-export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground">
            Manage cities and countries available in the platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCities}</div>
            <p className="text-xs text-muted-foreground">
              Active locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.countries}</div>
            <p className="text-xs text-muted-foreground">
              Unique countries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Across all cities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <EyeOff className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Hidden from users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Cities</CardTitle>
          <CardDescription>
            View and manage city locations. Click on any city to view details or edit information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CitiesClient cities={cities} />
        </CardContent>
      </Card>
    </div>
  )
}
