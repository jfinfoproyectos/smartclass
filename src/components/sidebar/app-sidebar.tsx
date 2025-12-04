"use client"

import * as React from "react"
import { BookOpen, Settings2, Bell, Calendar, CalendarClock, BarChart, Users, FileText, Activity, ScrollText, Home } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"

import { authClient } from "@/lib/auth-client"
import { getRoleFromUser } from "@/services/authService"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { AppIdentity } from "./app-identity"
import { getUnreadNotificationCountAction } from "@/app/actions"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession()
  const [unreadCount, setUnreadCount] = React.useState(0)

  const role = getRoleFromUser(session?.user)

  // Fetch unread count for students
  React.useEffect(() => {
    if (role === "student") {
      getUnreadNotificationCountAction().then(count => {
        setUnreadCount(count)
      }).catch(() => {
        setUnreadCount(0)
      })
    }
  }, [role])

  if (isPending) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <AppIdentity />
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-sidebar-accent" />
            <div className="h-4 w-32 animate-pulse rounded bg-sidebar-accent" />
            <div className="h-4 w-20 animate-pulse rounded bg-sidebar-accent" />
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="h-12 w-full animate-pulse rounded bg-sidebar-accent" />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }

  const navMain =
    role === "admin"
      ? [
        {
          title: "Inicio",
          url: "/dashboard",
          icon: Home,
          isActive: false,
        },
        {
          title: "Usuarios",
          url: "/dashboard/admin/users",
          icon: Users,
          isActive: false,
        },
        {
          title: "Cursos",
          url: "/dashboard/admin/courses",
          icon: BookOpen,
          isActive: false,
        },
        {
          title: "Anuncios",
          url: "/dashboard/admin/announcements",
          icon: Bell,
          isActive: false,
        },
        {
          title: "Sistema",
          url: "/dashboard/admin/system",
          icon: Activity,
          isActive: false,
        },
        {
          title: "Auditoría",
          url: "/dashboard/admin/audit",
          icon: ScrollText,
          isActive: false,
        },
        {
          title: "Configuración",
          url: "/dashboard/admin/settings",
          icon: Settings2,
          isActive: false,
        },
      ]
      : role === "teacher"
        ? [
          {
            title: "Inicio",
            url: "/dashboard",
            icon: Home,
            isActive: false,
          },
          {
            title: "Cursos",
            url: "/dashboard/teacher",
            icon: BookOpen,
            isActive: true,
          },
          {
            title: "Notificaciones",
            url: "/dashboard/teacher/notifications",
            icon: Bell,
            isActive: false,
          },
          {
            title: "Calendario",
            url: "/dashboard/calendar",
            icon: Calendar,
            isActive: false,
          },
          {
            title: "Horario",
            url: "/dashboard/teacher/schedule",
            icon: CalendarClock,
            isActive: false,
          },
          {
            title: "Estadísticas",
            url: "/dashboard/teacher/statistics",
            icon: BarChart,
            isActive: false,
          },
        ]
        : [
          {
            title: "Inicio",
            url: "/dashboard",
            icon: Home,
            isActive: false,
          },
          {
            title: "Cursos",
            url: "/dashboard/student",
            icon: BookOpen,
            isActive: true,
          },
          {
            title: "Notificaciones",
            url: "/dashboard/student/notifications",
            icon: Bell,
            isActive: false,
            badge: unreadCount,
          },
          {
            title: "Calendario",
            url: "/dashboard/calendar",
            icon: Calendar,
            isActive: false,
          },
          {
            title: "Horario",
            url: "/dashboard/student/schedule",
            icon: CalendarClock,
            isActive: false,
          },
        ]

  const user = {
    name: (session?.user as { name?: string } | null | undefined)?.name || "Usuario",
    email: (session?.user as { email?: string } | null | undefined)?.email || "m@example.com",
    avatar:
      (session?.user as { image?: string } | null | undefined)?.image || "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-0">
        <AppIdentity />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
