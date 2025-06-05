import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Building } from "lucide-react"
import { getRoleDisplayText } from "@/lib/rbac"
import Link from "next/link"

export default async function AreaUsersPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get current user data to check permissions
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  // Only area coordinators can access this page
  if (!currentUser || currentUser.role !== "area_coordinator") {
    redirect("/dashboard")
  }

  // Get users from the same department
  const { data: areaUsers } = await supabase
    .from("users")
    .select("*")
    .eq("department", currentUser.department)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios del Área</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del área de {currentUser.department}</p>
        </div>
        <Link href="/dashboard/area-users/invite">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar Usuario
          </Button>
        </Link>
      </div>

      {/* Area Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total en el Área</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areaUsers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Operativo</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areaUsers?.filter((u) => u.role === "operational_staff").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Externo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areaUsers?.filter((u) => u.role === "external_personnel").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Área {currentUser.department}</CardTitle>
          <CardDescription>Personal asignado a tu área de responsabilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {areaUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleDisplayText(user.role as any)}</Badge>
                      {user.totp_enabled && <Badge variant="secondary">2FA Activo</Badge>}
                      {user.id === currentUser.id && <Badge variant="outline">Tú</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/area-users/${user.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Perfil
                    </Button>
                  </Link>
                  {user.id !== currentUser.id &&
                    (user.role === "operational_staff" || user.role === "external_personnel") && (
                      <Link href={`/dashboard/area-users/${user.id}/manage`}>
                        <Button variant="outline" size="sm">
                          Gestionar
                        </Button>
                      </Link>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "system_admin":
      return "destructive" as const
    case "area_coordinator":
      return "default" as const
    case "operational_staff":
      return "secondary" as const
    case "external_personnel":
      return "outline" as const
    default:
      return "outline" as const
  }
}
