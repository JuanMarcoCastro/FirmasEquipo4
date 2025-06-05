import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Users, Calendar, ExternalLink, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import PDF viewer directly
import PDFViewer from "@/components/documents/pdf-viewer"

interface DocumentPageProps {
  params: {
    id: string
  }
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = params
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get document details
  const { data: document } = await supabase
    .from("documents")
    .select(`
      *,
      users!documents_uploaded_by_fkey (
        full_name,
        department
      )
    `)
    .eq("id", id)
    .single()

  if (!document) {
    redirect("/dashboard/documents")
  }

  // Check if user has permission to view this document
  const { data: permission } = await supabase
    .from("document_permissions")
    .select("*")
    .eq("document_id", id)
    .eq("user_id", session.user.id)
    .single()

  // Get current user data to check role
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  // Check if user can view this document
  const canView =
    document.uploaded_by === session.user.id ||
    permission ||
    currentUser?.role === "system_admin" ||
    (currentUser?.role === "area_coordinator" && currentUser?.department === document.users?.department)

  if (!canView) {
    redirect("/dashboard/documents")
  }

  // Get document signatures
  const { data: signatures } = await supabase
    .from("signatures")
    .select(`
      *,
      users (
        full_name,
        department
      ),
      user_certificates (
        certificate_name
      )
    `)
    .eq("document_id", id)
    .order("created_at", { ascending: false })

  // Get document URL from storage
  const { data: fileUrl } = supabase.storage.from("documents").getPublicUrl(document.file_path)

  // Check if file exists by trying to get file info
  const { data: fileInfo, error: fileError } = await supabase.storage
    .from("documents")
    .list(document.file_path.split("/")[0], {
      search: document.file_path.split("/")[1],
    })

  const fileExists = !fileError && fileInfo && fileInfo.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
          <p className="text-muted-foreground">{document.description || "Sin descripción"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={fileUrl.publicUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={fileUrl.publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir en nueva pestaña
            </a>
          </Button>
          {permission?.permission_type === "sign" && (
            <Link href={`/dashboard/sign/${id}`}>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Firmar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!fileExists && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El archivo del documento no se encontró en el almacenamiento. Es posible que haya sido movido o eliminado.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vista del Documento</CardTitle>
              <CardDescription>
                {fileExists ? (
                  <>
                    Visualiza el documento a continuación. Si tienes problemas con el visor, puedes{" "}
                    <a
                      href={fileUrl.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      abrirlo en una nueva pestaña
                    </a>
                    .
                  </>
                ) : (
                  "El archivo del documento no está disponible actualmente."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fileExists ? (
                <PDFViewer fileUrl={fileUrl.publicUrl} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Documento no disponible</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    El archivo del documento no se pudo encontrar en el almacenamiento.
                  </p>
                  <Button variant="outline" asChild>
                    <a href={fileUrl.publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Intentar abrir de todos modos
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Subido por {document.users?.full_name} ({document.users?.department})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatDistanceToNow(new Date(document.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {document.signature_count} / {document.requires_signatures} firmas
                </span>
              </div>
              <div>
                <Badge variant={getStatusBadgeVariant(document.status)}>{getStatusText(document.status)}</Badge>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Ruta del archivo: {document.file_path}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firmas del Documento</CardTitle>
              <CardDescription>
                {signatures?.length || 0} de {document.requires_signatures} firmas completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signatures && signatures.length > 0 ? (
                <div className="space-y-4">
                  {signatures.map((signature) => (
                    <div key={signature.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="rounded-full bg-green-100 p-2">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{signature.users?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{signature.users?.department}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(signature.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                        {signature.signature_reason && (
                          <p className="text-xs text-muted-foreground mt-1">Motivo: {signature.signature_reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay firmas aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
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
