import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { CertificateGenerationForm } from "@/components/certificates/certificate-generation-form"

export default async function GenerateCertificatePage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data for pre-filling the form
  const { data: userData } = await supabase
    .from("users")
    .select("full_name, email, department")
    .eq("id", session.user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generar Certificado Digital</h1>
        <p className="text-muted-foreground">
          Crea un nuevo certificado digital autofirmado para firmar documentos de manera segura
        </p>
      </div>

      <CertificateGenerationForm userId={session.user.id} userData={userData} />
    </div>
  )
}
