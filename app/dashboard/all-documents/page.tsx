import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Eye, FileSignature, Users, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export const revalidate = 0 // Ensure fresh data on each request

export default async function AllDocumentsPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: currentUser } = await supabase.from("users").select("role").eq("id", user.id).single()

  // This page is only for system_admin
  if (currentUser?.role !== "system_admin") {
    redirect("/dashboard")
  }

  // For system_admin, RLS policy allows fetching all documents.
  // No additional client-side filtering is needed for fetching.
  const { data: allDocuments, error: docsError } = await supabase
    .from("documents")
    .select(`
      id,
      title,
      description,
      status,
      signature_count,
      requires_signatures,
      created_at,
      uploaded_by,
      file_path,
      users!documents_uploaded_by_fkey (
        full_name,
        department,
        role
      )
    `)
    .order("created_at", { ascending: false })

  if (docsError) {
    console.error("Error fetching all documents for admin:", docsError.message)
    // Potentially show an error message to the user
  }

  // Statistics (can be refined or made more efficient if needed)
  const totalDocsCount = allDocuments?.length || 0
  const pendingDocsCount =
    allDocuments?.filter((doc) => doc.status !== "signed" && doc.status !== "archived").length || 0
  const signedDocsCount = allDocuments?.filter((doc) => doc.status === "signed").length || 0

  // This is a rough count of all signature records, not unique documents with signatures.
  const { data: totalSignaturesData, error: totalSignaturesError } = await supabase
    .from("document_signatures")
    .select("id", { count: "exact" })

  if (totalSignaturesError) {
    console.error("Error fetching total signatures count:", totalSignaturesError.message)
  }
  const totalSignaturesCount = totalSignaturesData?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Todos los Documentos del Sistema</h1>
        <p className="text-muted-foreground">Vista completa de todos los documentos en el sistema.</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocsCount}</div>
            <p className="text-xs text-muted-foreground">En todo el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Firma</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocsCount}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completamente Firmados</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signedDocsCount}</div>
            <p className="text-xs text-muted-foreground">Proceso finalizado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Firmas Registradas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSignaturesCount}</div>
            <p className="text-xs text-muted-foreground">En todos los documentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for Filters - Implement as needed */}
      {/* 
      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Buscar por título..." />
        </CardContent>
      </Card>
      */}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Documentos</CardTitle>
          <CardDescription>Todos los documentos registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {allDocuments && allDocuments.length > 0 ? (
            <div className="space-y-4">
              {allDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{document.title}</h3>
                      <p className="text-sm text-muted-foreground">{document.description || "Sin descripción"}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Subido por {document.users?.full_name || "N/A"} ({document.users?.department || "N/A"})
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
                          {document.signature_count || 0} / {document.requires_signatures || 1} firmas
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(document.status)}>{getStatusText(document.status)}</Badge>
                        <Badge variant="outline">{getRoleDisplayText(document.users?.role || "N/A")}</Badge>
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
                    <Link href={`/dashboard/documents/${document.id}/manage`}>
                      <Button variant="outline" size="sm">
                        <Users className="mr-2 h-4 w-4" />
                        Gestionar
                      </Button>
                    </Link>
                    {document.status !== "signed" && (
                      <Link href={`/dashboard/sign/${document.id}`}>
                        <Button size="sm">
                          <FileSignature className="mr-2 h-4 w-4" />
                          Firmar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No hay documentos en el sistema.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getRoleDisplayText(role: string) {
  switch (role) {
    case "system_admin":
      return "Admin Sistema"
    case "area_coordinator":
      return "Coordinador Área"
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
