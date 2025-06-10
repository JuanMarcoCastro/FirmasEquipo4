import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import RolePermissionsManager from "@/components/role-management/role-permissions-manager"

export default async function RoleManagementPage() {
  const supabase = createServerComponentClient({ cookies })

  // Verificar usuario de forma segura
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Verificar que sea administrador
  if (!profile || profile.role !== "system_admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Roles</h1>
        <p className="text-muted-foreground">
          Administra los permisos de cada rol en el sistema. Los cambios se aplicarán inmediatamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permisos por Rol</CardTitle>
          <CardDescription>
            Configure qué permisos tiene cada rol en el sistema. Use con precaución ya que estos cambios afectan el
            acceso de todos los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolePermissionsManager />
        </CardContent>
      </Card>
    </div>
  )
}
