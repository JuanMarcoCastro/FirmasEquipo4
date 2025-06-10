"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  Users,
  Settings,
  Shield,
  User,
  FileCheck,
  UserCheck,
  Building,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardNavProps {
  role: string
  department?: string
}

export default function DashboardNav({ role, department }: DashboardNavProps) {
  const pathname = usePathname()

  const handleNavigation = (href: string, title: string) => {
    console.log(`Navigating to: ${href} (${title})`)
    try {
      // El Link manejará la navegación
    } catch (error) {
      console.error(`Navigation error to ${href}:`, error)
    }
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["system_admin", "area_coordinator", "operational_staff", "external_personnel"],
    },
    {
      title: "Mis Documentos",
      href: "/dashboard/documents",
      icon: FileText,
      roles: ["system_admin", "area_coordinator", "operational_staff", "external_personnel"],
    },
    {
      title: "Firmar Documentos",
      href: "/dashboard/sign",
      icon: FileSignature,
      roles: ["system_admin", "area_coordinator", "operational_staff", "external_personnel"],
    },
    {
      title: "Documentos Firmados",
      href: "/dashboard/signed",
      icon: FileCheck,
      roles: ["system_admin", "area_coordinator", "operational_staff", "external_personnel"],
    },
    {
      title: "Todos los Documentos",
      href: "/dashboard/all-documents",
      icon: FileText,
      roles: ["system_admin"],
    },
    {
      title: "Gestión de Usuarios",
      href: "/dashboard/users",
      icon: Users,
      roles: ["system_admin"],
    },
    {
      title: "Usuarios del Área",
      href: "/dashboard/area-users",
      icon: UserCheck,
      roles: ["area_coordinator"],
    },
    {
      title: "Documentos del Área",
      href: "/dashboard/area-documents",
      icon: Building,
      roles: ["area_coordinator"],
    },
    {
      title: "Certificados",
      href: "/dashboard/certificates",
      icon: Shield,
      roles: ["system_admin", "area_coordinator", "operational_staff", "external_personnel"],
    },
    {
      title: "Perfil",
      href: "/dashboard/profile",
      icon: User,
      roles: ["system_admin", "area_coordinator", "operational_staff", "external_personnel"],
    },
    {
      title: "Configuración del Sistema",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["system_admin"],
    },
    {
      title: "Gestión de Roles",
      href: "/dashboard/role-management",
      icon: Shield,
      roles: ["system_admin"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <nav className="hidden md:block w-64 border-r bg-muted/40 p-6">
      <div className="space-y-1">
        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium text-primary">{getRoleText(role)}</p>
          {department && <p className="text-xs text-muted-foreground">{department}</p>}
        </div>
        {filteredNavItems.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Button
              variant="ghost"
              className={cn("w-full justify-start text-left", pathname === item.href && "bg-muted")}
              asChild={false}
            >
              <div className="flex items-center">
                <item.icon className="mr-2 h-5 w-5" />
                {item.title}
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  )
}

function getRoleText(role: string) {
  switch (role) {
    case "system_admin":
      return "Administrador del Sistema"
    case "area_coordinator":
      return "Coordinador de Área"
    case "operational_staff":
      return "Personal Operativo"
    case "external_personnel":
      return "Personal Externo"
    default:
      return role
  }
}
