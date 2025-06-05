import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileSignature, Clock, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default async function SignDocumentsPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get current user data
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  if (!currentUser) {
    redirect("/login")
  }

  // Get documents that the user can sign
  const { data: documentsToSign } = await supabase
    .from("document_permissions")
    .select(`
      document_id,
      permission_type,
      documents (
        id,
        title,
        description,
        status,
        signature_count,
        requires_signatures,
        created_at,
        uploaded_by,
        users!documents_uploaded_by_fkey (
          full_name,
          department
        )
      )
    `)
    .eq("user_id", session.user.id)
    .eq("permission_type", "sign")
    .neq("documents.status", "signed")
    .neq("documents.status", "archived")

  // Filter out documents that the user has already signed
  const { data: userSignatures } = await supabase
    .from("signatures")
    .select("document_id")
    .eq("user_id", session.user.id)

  const signedDocumentIds = new Set(userSignatures?.map((sig) => sig.document_id) || [])

  const pendingDocuments =
    documentsToSign?.filter((item) => item.documents && !signedDocumentIds.has(item.documents.id)) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentos para Firmar</h1>
        <p className="text-muted-foreground">Documentos que requieren tu firma digital</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Firma</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocuments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Firmados</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userSignatures?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tu Rol</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{getRoleDisplayText(currentUser.role)}</div>
            <div className="text-xs text-muted-foreground">{currentUser.department}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents to Sign */}
      {pendingDocuments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Documentos Pendientes</CardTitle>
            <CardDescription>Documentos que requieren tu firma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDocuments.map((item) => {
                const document = item.documents
                if (!document) return null

                return (
                  <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <FileSignature className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{document.title}</h3>
                        <p className="text-sm text-muted-foreground">{document.description || "Sin descripción"}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Subido por {document.users?.full_name} ({document.users?.department})
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(document.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {document.signature_count} / {document.requires_signatures} firmas
                          </span>
                        </div>
                        <div className="mt-1">
                          <Badge variant={getStatusBadgeVariant(document.status)}>
                            {getStatusText(document.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/documents/${document.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/dashboard/sign/${document.id}`}>
                        <Button size="sm">
                          <FileSignature className="mr-2 h-4 w-4" />
                          Firmar
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <FileSignature className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">No hay documentos pendientes</h3>
            <p className="text-sm text-muted-foreground">No tienes documentos pendientes de firma en este momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getRoleDisplayText(role: string) {
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

function getStatusText(status: string) {
  switch (status) {
    case "pending":
      return "Pendiente"
    case "in_review":
      return "En revisión"
    case "signed":
      return "Firmado"
    case "rejected":
      return "Rechazado"
    case "archived":
      return "Archivado"
    default:
      return status
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "pending":
      return "secondary" as const
    case "in_review":
      return "default" as const
    case "signed":
      return "outline" as const
    case "rejected":
      return "destructive" as const
    case "archived":
      return "outline" as const
    default:
      return "outline" as const
  }
}
