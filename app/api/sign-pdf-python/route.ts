import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const documentId = formData.get("documentId") as string
    const certificateId = formData.get("certificateId") as string
    const signatureReason = (formData.get("signatureReason") as string) || "Firma digital"
    const pdfFile = formData.get("pdf") as File

    if (!documentId || !pdfFile) {
      return NextResponse.json({ error: "Documento y PDF requeridos" }, { status: 400 })
    }

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    const pdfBase64 = pdfBuffer.toString("base64")

    // Get document info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // Check permissions (simplified for demo)
    const { data: permission } = await supabase
      .from("document_permissions")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .eq("permission_type", "sign")
      .single()

    if (!permission && document.uploaded_by !== user.id) {
      return NextResponse.json({ error: "Sin permisos para firmar este documento" }, { status: 403 })
    }

    // Call Python script to sign PDF
    const pythonScript = path.join(process.cwd(), "scripts", "digital_signature_backend.py")

    const pythonProcess = spawn("python3", [
      pythonScript,
      "--action",
      "sign_pdf",
      "--user_id",
      user.id,
      "--certificate_id",
      certificateId || "",
      "--signature_reason",
      signatureReason,
      "--pdf_base64",
      pdfBase64,
      "--supabase_url",
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      "--supabase_key",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    ])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    return new Promise((resolve) => {
      pythonProcess.on("close", async (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)

            // Save signature record in database
            const { data: signature, error: sigError } = await supabase
              .from("document_signatures")
              .insert({
                document_id: documentId,
                user_id: user.id,
                certificate_id: certificateId || null,
                signature_reason: signatureReason,
                signature_data: {
                  signature_hash: result.signature_hash,
                  signing_time: result.signing_time,
                  signer_name: result.signer_name,
                },
                signature_hash: result.signature_hash,
                signed_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (sigError) {
              console.error("Database error:", sigError)
              resolve(
                NextResponse.json(
                  {
                    error: "Error guardando firma en base de datos",
                  },
                  { status: 500 },
                ),
              )
              return
            }

            // Return signed PDF
            const signedPdfBuffer = Buffer.from(result.signed_pdf_base64, "base64")

            resolve(
              new NextResponse(signedPdfBuffer, {
                headers: {
                  "Content-Type": "application/pdf",
                  "Content-Disposition": `attachment; filename="signed_${document.title}.pdf"`,
                  "X-Signature-Hash": result.signature_hash,
                  "X-Signature-ID": signature.id,
                },
              }),
            )
          } catch (e) {
            console.error("Parse error:", e)
            resolve(
              NextResponse.json(
                {
                  error: "Error procesando PDF firmado",
                },
                { status: 500 },
              ),
            )
          }
        } else {
          console.error("Python script error:", errorOutput)
          resolve(
            NextResponse.json(
              {
                error: `Error firmando PDF: ${errorOutput || "Error desconocido"}`,
              },
              { status: 500 },
            ),
          )
        }
      })
    })
  } catch (error: any) {
    console.error("Error signing PDF:", error)
    return NextResponse.json(
      {
        error: `Error interno del servidor: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
