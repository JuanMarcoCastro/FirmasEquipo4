import { redirect, notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { CertificateDetailsView } from "@/components/certificates/certificate-details-view"

interface CertificateDetailsPageProps {
  params: {
    id: string
  }
}

export default async function CertificateDetailsPage({ params }: CertificateDetailsPageProps) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get certificate details
  const { data: certificate, error } = await supabase
    .from("user_certificates")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id) // Ensure user owns this certificate
    .single()

  if (error || !certificate) {
    notFound()
  }

  // Get documents signed with this certificate
  const { data: signedDocuments } = await supabase
    .from("document_signatures")
    .select(`
      id,
      signed_at,
      signature_reason,
      documents (
        id,
        title,
        description,
        file_path
      )
    `)
    .eq("user_id", session.user.id)
    .eq("certificate_id", params.id)
    .order("signed_at", { ascending: false })

  return (
    <div className="space-y-6">
      <CertificateDetailsView
        certificate={certificate}
        signedDocuments={signedDocuments || []}
        userId={session.user.id}
      />
    </div>
  )
}
