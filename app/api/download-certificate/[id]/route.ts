import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // Get certificate info
    const { data: certificate, error: certError } = await supabase
      .from("user_certificates")
      .select("certificate_storage_path, certificate_name")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (certError || !certificate) {
      return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 })
    }

    if (!certificate.certificate_storage_path) {
      return NextResponse.json({ error: "Ruta del certificado no disponible" }, { status: 404 })
    }

    // Download from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("user-certificates-bucket")
      .download(certificate.certificate_storage_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Error al descargar certificado" }, { status: 500 })
    }

    // Return the file
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": "application/x-pem-file",
        "Content-Disposition": `attachment; filename="${certificate.certificate_name}.pem"`,
      },
    })
  } catch (error: any) {
    console.error("Error downloading certificate:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
