import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Mail, Calendar, Shield, Building, Key, Clock } from "lucide-react"
import { getRoleDisplayText } from "@/lib/rbac"
import Link from "next/link"

interface UserDetailsPageProps {
  params: {
    id: string
  }
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get current user data to check permissions
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  // Only system admins can access this page
  if (!currentUser || currentUser.role !== "system_admin") {
    redirect("/dashboard")
  }

  // Get user details
  const { data: user } = await supabase.from("users").select("*").eq("id", params.id).single()

  if (!user) {
    redirect("/dashboard/users")
  }

  // Get user's certificates
  const { data: certificates } = await supabase
    .from("user_certificates")
    .select("*")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })

  // Get user's document signatures
  const { data: signatures } = await supabase
    .from("document_signatures")
    .select("*, documents(title)")
    .eq("user_id", params.id)
    .order("signed_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalles del Usuario</h1>
          <p className="text-muted-foreground">Información completa del usuario</p>
        </div>
        <div className="ml-auto">
          <Link href={`/dashboard/users/${user.id}/edit`}>
            <Button>Editar Usuario</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
              <p className="text-lg font-semibold">{user.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
              <p>{user.phone || "No especificado"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Registro</label>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(user.created_at).toLocaleDateString("es-ES")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rol y Permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rol</label>
              <div className="mt-1">
                <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleDisplayText(user.role as any)}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Departamento</label>
              <p className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                {user.department || "No asignado"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Autenticación de Dos Factores</label>
              <div className="mt-1">
                <Badge variant={user.totp_enabled ? "default" : "secondary"}>
                  <Key className="mr-1 h-3 w-3" />
                  {user.totp_enabled ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Último Acceso</label>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("es-ES") : "Nunca"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>Certificados Digitales</CardTitle>
            <CardDescription>Certificados subidos por el usuario</CardDescription>
          </CardHeader>
          <CardContent>
            {certificates && certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Subido: {new Date(cert.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Badge variant={cert.is_active ? "default" : "secondary"}>
                      {cert.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay certificados subidos</p>
            )}
          </CardContent>
        </Card>

        {/* Document Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Firmados</CardTitle>
            <CardDescription>Historial de firmas del usuario</CardDescription>
          </CardHeader>
          <CardContent>
            {signatures && signatures.length > 0 ? (
              <div className="space-y-3">
                {signatures.slice(0, 5).map((signature) => (
                  <div key={signature.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{signature.documents?.title || "Documento eliminado"}</p>
                      <p className="text-sm text-muted-foreground">
                        Firmado: {new Date(signature.signed_at).toLocaleString("es-ES")}
                      </p>
                    </div>
                    <Badge variant="outline">Firmado</Badge>
                  </div>
                ))}
                {signatures.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Y {signatures.length - 5} documentos más...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No ha firmado documentos</p>
            )}
          </CardContent>
        </Card>
      </div>
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
