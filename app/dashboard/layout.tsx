import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import DashboardNav from "@/components/dashboard/dashboard-nav"
import DashboardHeader from "@/components/dashboard/dashboard-header"

// Función separada para obtener el usuario autenticado
async function getAuthenticatedUser() {
  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return data.user
}

// Función separada para obtener o crear el perfil de usuario
async function getUserProfile(user) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

  if (!error && data) {
    return data
  }

  // Si no existe el perfil, intentamos crearlo
  const newUser = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email.split("@")[0],
    role: "external_personnel",
    department: "Sin asignar",
    totp_enabled: false,
  }

  const { data: createdUser, error: insertError } = await supabase.from("users").insert(newUser).select().single()

  if (!insertError && createdUser) {
    return createdUser
  }

  // Fallback si hay error al crear
  return {
    ...newUser,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Obtener usuario autenticado (sin try-catch)
  const user = await getAuthenticatedUser()

  // Redireccionar si no hay usuario autenticado
  if (!user) {
    redirect("/login")
  }

  // Obtener perfil de usuario (sin try-catch para redirecciones)
  const userProfile = await getUserProfile(user)

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={userProfile} />
      <div className="flex flex-1">
        <DashboardNav role={userProfile.role} department={userProfile.department} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
