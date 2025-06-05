import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileSignature, Users, Clock } from "lucide-react"

export default async function DashboardPage() {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido al sistema Casa Monarca</p>
          </div>
        </div>
      )
    }

    // Get user data with error handling
    let userData = null
    try {
      const { data } = await supabase.from("users").select("*").eq("id", session.user.id).maybeSingle()
      userData = data
    } catch (error) {
      console.error("Error fetching user data:", error)
    }

    // Get document counts with error handling
    let totalDocuments = 0
    let pendingSignatures = 0
    let signedDocuments = 0
    let userCount = 0

    try {
      const { count: docsCount } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("uploaded_by", session.user.id)
      totalDocuments = docsCount || 0
    } catch (error) {
      console.error("Error fetching documents count:", error)
    }

    try {
      const { count: pendingCount } = await supabase
        .from("document_permissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("permission_type", "sign")
      pendingSignatures = pendingCount || 0
    } catch (error) {
      console.error("Error fetching pending signatures:", error)
    }

    try {
      const { count: signedCount } = await supabase
        .from("signatures")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
      signedDocuments = signedCount || 0
    } catch (error) {
      console.error("Error fetching signed documents:", error)
    }

    // For admin and coordinators, get user count
    if (userData?.role === "system_admin" || userData?.role === "area_coordinator") {
      try {
        const { count } = await supabase.from("users").select("id", { count: "exact", head: true })
        userCount = count || 0
      } catch (error) {
        console.error("Error fetching user count:", error)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido{userData?.full_name ? `, ${userData.full_name}` : ""}. Aquí tienes un resumen de tu actividad.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Documentos subidos por ti</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Firma</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSignatures}</div>
              <p className="text-xs text-muted-foreground">Documentos que requieren tu firma</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Firmados</CardTitle>
              <FileSignature className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{signedDocuments}</div>
              <p className="text-xs text-muted-foreground">Documentos que has firmado</p>
            </CardContent>
          </Card>

          {(userData?.role === "system_admin" || userData?.role === "area_coordinator") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCount}</div>
                <p className="text-xs text-muted-foreground">Usuarios registrados en el sistema</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sistema iniciado</p>
                    <p className="text-xs text-muted-foreground">Bienvenido al sistema</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>Información general del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sistema operativo</p>
                      <p className="text-xs text-muted-foreground">Todos los servicios funcionando</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Dashboard page error:", error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al sistema Casa Monarca</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Hubo un problema al cargar los datos. Por favor, recarga la página.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
