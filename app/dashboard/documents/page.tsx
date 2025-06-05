import Link from "next/link"
import { createServerClient } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, FileSignature, Trash2, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import DocumentUploadButton from "@/components/documents/document-upload-button"

export default async function DocumentsPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Get user documents
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      id,
      title,
      description,
      status,
      signature_count,
      requires_signatures,
      created_at,
      updated_at
    `)
    .eq("uploaded_by", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Documentos</h1>
          <p className="text-muted-foreground">Gestiona tus documentos y solicitudes de firma</p>
        </div>
        <DocumentUploadButton userId={session.user.id} />
      </div>

      {documents && documents.length > 0 ? (
        <div className="grid gap-6">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      {document.signature_count > 0 ? (
                        <FileSignature className="h-6 w-6 text-primary" />
                      ) : (
                        <FileText className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{document.title}</h3>
                      <p className="text-sm text-muted-foreground">{document.description || "Sin descripción"}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Creado{" "}
                          {formatDistanceToNow(new Date(document.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {document.signature_count} / {document.requires_signatures} firmas
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className={`text-xs font-medium ${getStatusColor(document.status)}`}>
                          {getStatusText(document.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/documents/${document.id}`}>
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver documento</span>
                      </Button>
                    </Link>
                    <Link href={`/dashboard/documents/${document.id}/manage`}>
                      <Button variant="outline" size="icon">
                        <FileSignature className="h-4 w-4" />
                        <span className="sr-only">Gestionar firmas</span>
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Eliminar documento</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">No tienes documentos</h3>
            <p className="text-sm text-muted-foreground">Sube tu primer documento para comenzar</p>
            <DocumentUploadButton userId={session.user.id} className="mt-4" />
          </CardContent>
        </Card>
      )}
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

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "text-yellow-600"
    case "in_review":
      return "text-blue-600"
    case "signed":
      return "text-green-600"
    case "rejected":
      return "text-red-600"
    case "archived":
      return "text-gray-600"
    default:
      return "text-gray-600"
  }
}
