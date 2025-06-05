import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import DocumentSigningForm from "@/components/documents/document-signing-form"

interface SignDocumentPageProps {
  params: {
    id: string
  }
}

export default async function SignDocumentPage({ params }: SignDocumentPageProps) {
  const { id } = params
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user has permission to sign this document
  const { data: permission } = await supabase
    .from("document_permissions")
    .select("*")
    .eq("document_id", id)
    .eq("user_id", session.user.id)
    .eq("permission_type", "sign")
    .single()

  if (!permission) {
    redirect("/dashboard/sign")
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

  // Check if user has already signed this document
  const { data: existingSignature } = await supabase
    .from("signatures")
    .select("*")
    .eq("document_id", id)
    .eq("user_id", session.user.id)
    .single()

  if (existingSignature) {
    redirect(`/dashboard/documents/${id}`)
  }

  // Get document URL from storage
  const { data: fileUrl } = supabase.storage.from("documents").getPublicUrl(document.file_path)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firmar Documento</h1>
        <p className="text-muted-foreground">Firma el documento utilizando tu certificado digital</p>
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
          <DocumentSigningForm documentId={id} userId={session.user.id} documentUrl={fileUrl.publicUrl} />
        </CardContent>
      </Card>
    </div>
  )
}
