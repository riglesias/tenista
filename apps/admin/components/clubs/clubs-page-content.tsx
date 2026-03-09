"use client"

import { ClubsClient } from "@/components/clubs/clubs-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Trophy, KeyRound } from "lucide-react"
import { Organization, Court } from "@/types/database.types"

interface ClubWithStats extends Organization {
  member_count: number
  competition_count: number
  court_name?: string | null
}

interface ClubsPageContentProps {
  clubs: ClubWithStats[]
  stats: {
    totalClubs: number
    totalMembers: number
    clubCompetitions: number
    withJoinCodes: number
  }
  courts?: Court[]
}

export function ClubsPageContent({ clubs, stats, courts = [] }: ClubsPageContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Clubs</h2>
        <p className="text-muted-foreground">
          Manage clubs and their members
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClubs}</div>
            <p className="text-xs text-muted-foreground">
              Registered clubs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Across all clubs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Club Competitions</CardTitle>
            <Trophy className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.clubCompetitions}</div>
            <p className="text-xs text-muted-foreground">
              Linked to clubs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Join Codes</CardTitle>
            <KeyRound className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.withJoinCodes}</div>
            <p className="text-xs text-muted-foreground">
              Invite-only clubs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clubs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clubs</CardTitle>
          <CardDescription>
            View and manage clubs. Click on any club to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClubsClient clubs={clubs} courts={courts} />
        </CardContent>
      </Card>
    </div>
  )
}
