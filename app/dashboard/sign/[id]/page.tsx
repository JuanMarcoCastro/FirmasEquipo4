import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import EnhancedDigitalSignature from "@/components/documents/enhanced-digital-signature"

interface SignDocumentPageProps {
  params: {
    id: string
  }
}

export default async function SignDocumentPage({ params }: SignDocumentPageProps) {
  const { id } = params
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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
    redirect("/dashboard/sign")
  }

  // Check if user has permission to sign this document
  const { data: signPermission } = await supabase
    .from("document_permissions")
    .select("*")
    .eq("document_id", id)
    .eq("user_id", user.id)
    .eq("permission_type", "sign")
    .single()

  // Get current user data
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!currentUser) {
    redirect("/login")
  }

  // Check if user can sign this document (same logic as API)
  const canSign =
    signPermission ||
    document.uploaded_by === user.id ||
    currentUser.role === "system_admin" ||
    (currentUser.role === "area_coordinator" && currentUser.department === document.users?.department)

  if (!canSign) {
    redirect("/dashboard/sign")
  }

  // Check if user has already signed this document
  const { data: existingSignature } = await supabase
    .from("document_signatures")
    .select("*")
    .eq("document_id", id)
    .eq("user_id", user.id)
    .single()

  if (existingSignature) {
    redirect(`/dashboard/documents/${id}`)
  }

  // Get user's certificates
  const { data: userCertificates } = await supabase
    .from("user_certificates")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)

  // Get document URL from storage
  const { data: fileUrl } = supabase.storage.from("documents").getPublicUrl(document.file_path)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firmar Documento Digitalmente</h1>
        <p className="text-muted-foreground">Firma el documento "{document.title}" utilizando tu certificado digital</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{document.title}</CardTitle>
          <CardDescription>
            {document.description || "Sin descripción"}
            <div className="mt-1 text-xs">
              Subido por {document.users?.full_name} ({document.users?.department})
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" asChild>
              <a href={fileUrl.publicUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Descargar documento
              </a>
            </Button>
          </div>

          <EnhancedDigitalSignature documentId={id} userId={user.id} documentTitle={document.title} />
        </CardContent>
      </Card>
    </div>
  )
}
