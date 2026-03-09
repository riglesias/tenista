"use client"

import { useState } from "react"
import { CourtsClient } from "@/components/courts/courts-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, MapPin, Sun, Moon } from "lucide-react"

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

interface CourtsPageContentProps {
  courts: Court[]
  initialStats: {
    total: number
    publicCourts: number
    privateCourts: number
    withLights: number
  }
}

export function CourtsPageContent({ courts, initialStats }: CourtsPageContentProps) {
  const [stats, setStats] = useState(initialStats)

  const handleFilteredDataChange = (newStats: {
    total: number
    publicCourts: number
    privateCourts: number
    withLights: number
  }) => {
    setStats(newStats)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courts</h2>
          <p className="text-muted-foreground">
            Manage tennis court locations and information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Active locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Courts</CardTitle>
            <Sun className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.publicCourts}</div>
            <p className="text-xs text-muted-foreground">
              Open to everyone
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Private Courts</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.privateCourts}</div>
            <p className="text-xs text-muted-foreground">
              Members only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Lights</CardTitle>
            <Moon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.withLights}</div>
            <p className="text-xs text-muted-foreground">
              Night play available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courts</CardTitle>
          <CardDescription>
            View and manage tennis court locations. Click on any court to view details or edit information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourtsClient 
            courts={courts} 
            onFilteredDataChange={handleFilteredDataChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}