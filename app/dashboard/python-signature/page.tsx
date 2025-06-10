import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import PythonSignatureManager from "@/components/documents/python-signature-manager"

export default async function PythonSignaturePage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get a sample document for demonstration
  const { data: documents } = await supabase.from("documents").select("*").limit(1)

  const sampleDocument = documents?.[0] || {
    id: "demo",
    title: "Documento de Demostración",
    file_path: "demo.pdf",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firma Digital con Python</h1>
        <p className="text-muted-foreground">Sistema completo de firma digital usando PyHanko y certificados X.509</p>
      </div>

      <PythonSignatureManager
        documentId={sampleDocument.id}
        documentTitle={sampleDocument.title}
        documentUrl={`/documents/${sampleDocument.file_path}`}
      />
    </div>
  )
}
