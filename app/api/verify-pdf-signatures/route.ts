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
    const pdfFile = formData.get("pdf") as File
    const documentId = formData.get("documentId") as string

    if (!pdfFile) {
      return NextResponse.json({ error: "PDF requerido" }, { status: 400 })
    }

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    const pdfBase64 = pdfBuffer.toString("base64")

    // Call Python script to verify signatures
    const pythonScript = path.join(process.cwd(), "scripts", "digital_signature_backend.py")

    const pythonProcess = spawn("python3", [
      pythonScript,
      "--action",
      "verify_signatures",
      "--pdf_base64",
      pdfBase64,
      "--document_id",
      documentId || "",
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
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)

            resolve(
              NextResponse.json({
                documentId: documentId,
                totalSignatures: result.total_signatures,
                signatures: result.signatures,
                verificationTime: result.verification_time,
                isValid: result.signatures.every((sig: any) => sig.is_valid),
              }),
            )
          } catch (e) {
            console.error("Parse error:", e)
            resolve(
              NextResponse.json(
                {
                  error: "Error procesando verificación de firmas",
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
                error: `Error verificando firmas: ${errorOutput || "Error desconocido"}`,
              },
              { status: 500 },
            ),
          )
        }
      })
    })
  } catch (error: any) {
    console.error("Error verifying signatures:", error)
    return NextResponse.json(
      {
        error: `Error interno del servidor: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
