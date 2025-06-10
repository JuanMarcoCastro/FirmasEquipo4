import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileSignature, Clock, Eye, AlertCircle, Users, FileText, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const revalidate = 0 // Ensure fresh data on each request

export default async function SignDocumentsPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: currentUser, error: currentUserError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (currentUserError || !currentUser) {
    console.error("Error fetching current user or user not found:", currentUserError?.message)
    redirect("/login")
  }

  // This query will be filtered by RLS.
  // Admins will see all non-signed/archived documents.
  // Regular users will see documents they own or have 'view', 'sign', or 'manage' permission for,
  // that are not signed or archived.
  const { data: documentsPotentiallyToSign, error: docsError } = await supabase
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
      users!documents_uploaded_by_fkey (
        full_name,
        department
      )
    `)
    .neq("status", "signed")
    .neq("status", "archived")
    .order("created_at", { ascending: false })

  if (docsError) {
    console.error("Error fetching documents to sign (RLS should filter):", docsError.message)
    // Consider showing an error message to the user if this is critical
  }

  const allPotentiallySignableDocsCount = documentsPotentiallyToSign?.length || 0

  // Get documents that the user has already signed from both tables
  const { data: legacySignatures, error: legacySigError } = await supabase
    .from("signatures")
    .select("document_id")
    .eq("user_id", user.id)

  const { data: pyhankoSignatures, error: pyhankoSigError } = await supabase
    .from("document_signatures")
    .select("document_id")
    .eq("user_id", user.id)

  if (legacySigError) {
    console.error("Error fetching legacy signatures:", legacySigError.message)
  }

  if (pyhankoSigError) {
    console.error("Error fetching PyHanko signatures:", pyhankoSigError.message)
  }

  // Combine both signature sources
  const allUserSignatures = [...(legacySignatures || []), ...(pyhankoSignatures || [])]

  const userSignatures = allUserSignatures
  const sigError = legacySigError || pyhankoSigError

  const signedDocumentIds = new Set(userSignatures?.map((sig) => sig.document_id) || [])

  // Filter out documents that the user has already signed from the fetched list
  // Also, for non-admins, ensure they only see documents they have 'sign' permission for.
  // Admins can sign any document not yet signed by them.
  const pendingDocuments = (documentsPotentiallyToSign || []).filter((doc) => {
    if (!signedDocumentIds.has(doc.id)) {
      if (currentUser.role === "system_admin") {
        return true // Admins can sign any document not yet signed by them
      } else {
        // For regular users, we need to re-check if they have 'sign' permission specifically for this page's purpose.
        // This is a client-side check after RLS has already filtered for view/sign/manage.
        // A more optimized way would be a dedicated RLS/RPC for "documents_user_can_sign".
        // For now, we assume RLS for SELECT on 'documents' (via 'document_permissions') is sufficient
        // and this page is about documents they *can* sign.
        // The RLS policy for SELECT on documents already ensures they have 'view', 'sign', or 'manage'.
        // To be absolutely sure they can *sign*, we'd ideally check 'sign' permission explicitly here if RLS wasn't perfect.
        // However, the RLS for inserting a signature *will* check for 'sign' permission.
        return true // If RLS allowed view, and it's not signed by them, list it. Actual signing will be gated by 'sign' perm.
      }
    }
    return false
  })

  const totalSignedByUser = allUserSignatures?.length || 0

  // For non-admins, count documents they are specifically assigned to sign and are pending.
  // For admins, this shows total active documents in the system pending some signature.
  let relevantPendingCount = 0
  if (currentUser.role === "system_admin") {
    relevantPendingCount = allPotentiallySignableDocsCount // Total active docs in system
  } else {
    // Count documents user has 'sign' permission for
    const { data: userSignPermissions, error: permCountError } = await supabase
      .from("document_permissions")
      .select(`
        document_id,
        documents!inner (
          id,
          status
        )
      `)
      .eq("user_id", user.id)
      .eq("permission_type", "sign")
      .in("documents.status", ["pending", "in_review"])

    if (permCountError) console.error("Error fetching sign permission count:", permCountError.message)
    relevantPendingCount = userSignPermissions?.length || 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentos para Firmar</h1>
        <p className="text-muted-foreground">
          {currentUser.role === "system_admin"
            ? "Como administrador, puedes firmar cualquier documento del sistema que requiera firmas."
            : "Documentos que requieren tu firma digital."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Tu Firma</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Documentos que aún no has firmado.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Firmados</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSignedByUser}</div>
            <p className="text-xs text-muted-foreground">Por ti.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {currentUser.role === "system_admin" ? "Docs. Activos (Sistema)" : "Asignaciones (Firmar)"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relevantPendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {currentUser.role === "system_admin" ? "Que requieren firmas." : "Documentos asignados para tu firma."}
            </p>
            {currentUser.role === "system_admin" && (
              <Link href="/dashboard/all-documents" className="mt-2 block">
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Todos los Documentos
                </Button>
              </Link>
            )}
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

      {currentUser.role !== "system_admin" && relevantPendingCount === 0 && pendingDocuments.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes documentos asignados para firmar en este momento. Si esperas ver alguno, contacta al administrador
            o al dueño del documento.
          </AlertDescription>
        </Alert>
      )}

      {pendingDocuments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Documentos Pendientes de Tu Firma</CardTitle>
            <CardDescription>Estos son los documentos que puedes firmar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <FileSignature className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{document.title}</h3>
                      <p className="text-sm text-muted-foreground">{document.description || "Sin descripción"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs text-muted-foreground">
                          Subido por: {document.users?.full_name || "N/A"} ({document.users?.department || "N/A"})
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(document.created_at), { addSuffix: true, locale: es })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {document.signature_count || 0} / {document.requires_signatures || 1} firmas
                        </span>
                      </div>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(document.status)}>{getStatusText(document.status)}</Badge>
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
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (currentUser.role === "system_admin" &&
          allPotentiallySignableDocsCount > 0 &&
          pendingDocuments.length === 0) ||
        (currentUser.role !== "system_admin" && relevantPendingCount > 0 && pendingDocuments.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 font-semibold">Todo Firmado por Ti</h3>
            <p className="text-sm text-muted-foreground">
              {currentUser.role === "system_admin"
                ? "Has firmado todos los documentos activos que requerían tu firma o no hay documentos que necesiten tu firma en este momento."
                : "Has firmado todos los documentos que te fueron asignados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <FileSignature className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">No hay documentos pendientes</h3>
            <p className="text-sm text-muted-foreground">
              {currentUser.role === "system_admin"
                ? "No hay documentos pendientes de firma en el sistema en este momento."
                : "No tienes documentos asignados para firmar en este momento."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions (getRoleDisplayText, getStatusText, getStatusBadgeVariant) remain the same
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
