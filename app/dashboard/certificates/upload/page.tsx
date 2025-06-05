import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import CertificateUploadForm from "@/components/certificates/certificate-upload-form"

export default async function UploadCertificatePage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subir Certificado</h1>
        <p className="text-muted-foreground">Sube tu certificado digital para firmar documentos</p>
      </div>
      <CertificateUploadForm userId={session.user.id} />
    </div>
  )
}
