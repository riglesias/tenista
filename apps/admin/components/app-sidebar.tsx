"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Trophy,
  MapPin,
  Users,
  Settings,
  Calendar,
  Building2,
  Flag,
  Globe,
  Star,
} from "lucide-react"

import Image from "next/image"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

// Navigation data for Tenista Admin
const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Competitions",
      url: "/leagues",
      icon: Calendar,
    },
    {
      title: "Matches",
      url: "/matches",
      icon: Trophy,
    },
    {
      title: "Courts",
      url: "/courts",
      icon: MapPin,
    },
    {
      title: "Locations",
      url: "/cities",
      icon: Globe,
    },
    {
      title: "Players",
      url: "/players",
      icon: Users,
    },
    {
      title: "Clubs",
      url: "/clubs",
      icon: Building2,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: Flag,
    },
    {
      title: "Rating Requests",
      url: "/rating-requests",
      icon: Star,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState({
    name: "Loading...",
    email: "",
    avatar: "",
  })

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        // Get user's name from metadata or email
        const name = authUser.user_metadata?.full_name ||
                     authUser.user_metadata?.name ||
                     authUser.email?.split('@')[0] ||
                     'Admin'

        setUser({
          name,
          email: authUser.email || '',
          avatar: authUser.user_metadata?.avatar_url || '',
        })
      }
    }

    fetchUser()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/logo-icon.svg"
                    alt="Tenista"
                    width={32}
                    height={32}
                    className="size-8 rounded-lg"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Tenista</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
