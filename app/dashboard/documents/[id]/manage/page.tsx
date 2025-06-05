import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DocumentPermissionsManager from "@/components/documents/document-permissions-manager"

interface ManageDocumentPageProps {
  params: {
    id: string
  }
}

export default async function ManageDocumentPage({ params }: ManageDocumentPageProps) {
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

  // Get current user data to check permissions
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  // Check if user can manage this document
  const canManage =
    document.uploaded_by === session.user.id ||
    currentUser?.role === "system_admin" ||
    (currentUser?.role === "area_coordinator" && currentUser?.department === document.users?.department)

  if (!canManage) {
    redirect(`/dashboard/documents/${id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestionar Documento</h1>
        <p className="text-muted-foreground">Administra los permisos y firmas para: {document.title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Documento</CardTitle>
            <CardDescription>Detalles básicos del documento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <p className="text-sm text-muted-foreground">{document.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <p className="text-sm text-muted-foreground">{document.description || "Sin descripción"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <p className="text-sm text-muted-foreground">{document.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Firmas</label>
              <p className="text-sm text-muted-foreground">
                {document.signature_count} de {document.requires_signatures} completadas
              </p>
            </div>
          </CardContent>
        </Card>

        <DocumentPermissionsManager documentId={id} currentUserId={session.user.id} />
      </div>
    </div>
  )
}
