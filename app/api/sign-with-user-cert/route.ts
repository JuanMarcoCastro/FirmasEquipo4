import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { spawn } from "child_process"
import path from "path"
import { Buffer } from "buffer" // Ensure Buffer is available

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File | null
    const certificateId = formData.get("certificateId") as string | null
    const reason = formData.get("reason") as string | "Firma de conformidad"

    if (!pdfFile || !certificateId) {
      return NextResponse.json({ error: "PDF y ID de certificado son requeridos." }, { status: 400 })
    }

    // 1. Fetch certificate and private key paths from 'user_certificates' table
    const { data: certRecord, error: certRecordError } = await supabase
      .from("user_certificates")
      .select("certificate_storage_path, private_key_storage_path, users (full_name)") // Fetch user's full_name
      .eq("id", certificateId)
      .eq("user_id", user.id) // Ensure user owns the certificate
      .single()

    if (certRecordError || !certRecord) {
      return NextResponse.json({ error: "Certificado no encontrado o no autorizado." }, { status: 404 })
    }

    const userNameForSignature = certRecord.users?.full_name || user.email || "Usuario Desconocido"

    // 2. Download certificate and private key from Supabase Storage
    const { data: certBlob, error: certDownloadError } = await supabase.storage
      .from("user-certificates-bucket")
      .download(certRecord.certificate_storage_path)

    const { data: keyBlob, error: keyDownloadError } = await supabase.storage
      .from("user-certificates-bucket")
      .download(certRecord.private_key_storage_path)

    if (certDownloadError || !certBlob || keyDownloadError || !keyBlob) {
      return NextResponse.json({ error: "Error al descargar archivos de certificado/clave." }, { status: 500 })
    }

    const certPemBase64 = Buffer.from(await certBlob.arrayBuffer()).toString("base64")
    const keyPemBase64 = Buffer.from(await keyBlob.arrayBuffer()).toString("base64")
    const pdfBase64 = Buffer.from(await pdfFile.arrayBuffer()).toString("base64")

    // 3. Call Python script
    const pythonScript = path.join(process.cwd(), "scripts", "professional_signature_manager.py")
    const pythonProcess = spawn("python3", [
      pythonScript,
      "--action",
      "sign",
      "--pdf_base64",
      pdfBase64,
      "--key_pem_base64",
      keyPemBase64,
      "--cert_pem_base64",
      certPemBase64,
      "--user_name",
      userNameForSignature, // Use name from user profile
      "--reason",
      reason,
    ])

    let output = ""
    let errorOutput = ""
    pythonProcess.stdout.on("data", (data) => (output += data.toString()))
    pythonProcess.stderr.on("data", (data) => (errorOutput += data.toString()))

    return new Promise((resolve) => {
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            if (result.error) {
              resolve(NextResponse.json({ error: `Error de firma: ${result.error}` }, { status: 500 }))
              return
            }
            const signedPdfBuffer = Buffer.from(result.signed_pdf_base64, "base64")
            resolve(new NextResponse(signedPdfBuffer, { headers: { "Content-Type": "application/pdf" } }))
          } catch (e) {
            resolve(
              NextResponse.json({ error: "Fallo al parsear salida de Python.", details: output }, { status: 500 }),
            )
          }
        } else {
          resolve(
            NextResponse.json(
              { error: "Ejecución de script Python falló.", details: errorOutput, output: output },
              { status: 500 },
            ),
          )
        }
      })
    })
  } catch (error: any) {
    console.error("Error en sign-with-user-cert:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor." }, { status: 500 })
  }
}
