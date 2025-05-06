"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, FolderOpen, FileSignature, Users, Settings, Shield, Cloud, User } from "lucide-react"
import { NotificationsPopover } from "@/components/notifications-popover"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user] = useState({
    name: "Admin Usuario",
    email: "admin@example.com",
    role: "Admin",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FolderOpen, label: "Documentos", href: "/dashboard/documents" },
    { icon: FileSignature, label: "Firmas Pendientes", href: "/dashboard/pending" },
    { icon: Users, label: "Usuarios", href: "/dashboard/users" },
    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
  ]

  // Número de notificaciones pendientes
  const pendingNotifications = 3

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              {/* Aquí iría el logo de CasaMonarca */}
              <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs">Logo</div>
              <span className="font-bold text-lg">CasaMonarca</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user.role === "Admin" && (
              <SidebarGroup>
                <SidebarGroupLabel>Administración</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/users">
                          <Shield className="h-4 w-4" />
                          <span>Gestión de Permisos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/settings/cloud-storage">
                          <Cloud className="h-4 w-4" />
                          <span>Almacenamiento en la Nube</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard/profile">
                          <User className="h-4 w-4" />
                          <span>Perfil de Usuario</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-background p-4">
            <div className="flex justify-between items-center">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <NotificationsPopover count={pendingNotifications} />
                <Link href="/dashboard/profile">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
