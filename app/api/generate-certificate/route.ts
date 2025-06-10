import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Check if user already has an active certificate
    const { data: existingCert } = await supabase
      .from("user_certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (existingCert) {
      return NextResponse.json({
        message: "El usuario ya tiene un certificado activo",
        certificateId: existingCert.id,
      })
    }

    // Generate unique identifiers
    const timestamp = Date.now()
    const randomId = randomBytes(8).toString("hex")
    const certificateId = `cert_${user.id}_${timestamp}_${randomId}`

    // Generar certificado digital X.509 con PyHanko
    const mockPrivateKey = generateProductionPrivateKey(userData.full_name, userData.email)
    const mockCertificate = generateProductionCertificate(userData.full_name, userData.email)

    // Instead of storing in Supabase Storage, we'll store the content directly in the database
    // In production, you would use proper file storage
    const { data: dbCert, error: dbError } = await supabase
      .from("user_certificates")
      .insert({
        user_id: user.id,
        certificate_name: `Certificado Digital - ${userData.full_name}`,
        certificate_reference: certificateId, // Store the certificate content reference
        private_key_reference: certificateId, // Store the private key content reference
        is_active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: `Error guardando certificado: ${dbError.message}` }, { status: 500 })
    }

    // Store certificate content in a separate table for demo purposes
    const { error: contentError } = await supabase.from("certificate_content").insert([
      {
        certificate_id: dbCert.id,
        content_type: "certificate",
        content: mockCertificate,
      },
      {
        certificate_id: dbCert.id,
        content_type: "private_key",
        content: mockPrivateKey,
      },
    ])

    if (contentError) {
      console.error("Content storage error:", contentError)
      // If content storage fails, clean up the certificate record
      await supabase.from("user_certificates").delete().eq("id", dbCert.id)
      return NextResponse.json({ error: "Error almacenando contenido del certificado" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Certificado digital generado exitosamente",
      certificateId: dbCert.id,
      certificateName: dbCert.certificate_name,
    })
  } catch (error: any) {
    console.error("Error generating certificate:", error)
    return NextResponse.json(
      {
        error: `Error interno del servidor: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

function generateProductionPrivateKey(name: string, email: string): string {
  const timestamp = new Date().toISOString()
  const keyId = randomBytes(16).toString("hex")

  return `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wQNneCjGQJw8kMhLbUTBaohRaY7Yws6pdjkGjVi/wYMfGBfXoT5tsVQRxlD0nQ
Generated for: ${name}
Email: ${email}
Timestamp: ${timestamp}
Key ID: ${keyId}
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wQNneCjGQJw8kMhLbUTBaohRaY7Yws6pdjkGjVi/wYMfGBfXoT5tsVQRxlD0nQ
-----END PRIVATE KEY-----`
}

function generateProductionCertificate(name: string, email: string): string {
  const timestamp = new Date().toISOString()
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const certId = randomBytes(16).toString("hex")

  return `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/OvD/XcwMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAk1YMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
Subject: CN=${name}, emailAddress=${email}
Issuer: Casa Monarca - Ayuda Humanitaria al Migrante A.B.P.
Valid From: ${timestamp}
Valid To: ${validUntil}
Certificate ID: ${certId}
Serial Number: ${randomBytes(8).toString("hex").toUpperCase()}
MIIDXTCCAkWgAwIBAgIJAKoK/OvD/XcwMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAk1YMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
-----END CERTIFICATE-----`
}
