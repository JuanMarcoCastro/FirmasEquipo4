"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { hasPermission, type UserRole, type Permission } from "@/lib/rbac"

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermission: Permission
  fallback?: React.ReactNode
  requireRole?: UserRole[]
}

export default function PermissionGuard({
  children,
  requiredPermission,
  fallback = null,
  requireRole,
}: PermissionGuardProps) {
  const { supabase } = useSupabase()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserRole() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        const { data: userData } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        if (userData) {
          setUserRole(userData.role as UserRole)
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
      } finally {
        setLoading(false)
      }
    }

    getUserRole()
  }, [supabase])

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!userRole) {
    return fallback
  }

  // Check role requirement if specified
  if (requireRole && !requireRole.includes(userRole)) {
    return fallback
  }

  // Check permission requirement
  if (!hasPermission(userRole, requiredPermission)) {
    return fallback
  }

  return <>{children}</>
}
