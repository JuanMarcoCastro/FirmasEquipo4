import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import { Buffer } from "buffer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File | null

    if (!pdfFile) {
      return NextResponse.json({ error: "Archivo PDF es requerido." }, { status: 400 })
    }

    const pdfBase64 = Buffer.from(await pdfFile.arrayBuffer()).toString("base64")

    const pythonScript = path.join(process.cwd(), "scripts", "professional_signature_manager.py")
    const pythonProcess = spawn("python3", [pythonScript, "--action", "verify", "--pdf_base64", pdfBase64])

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
              resolve(NextResponse.json({ error: `Error de verificación: ${result.error}` }, { status: 500 }))
              return
            }
            resolve(NextResponse.json(result))
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
    console.error("Error en verify-professional-signatures:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor." }, { status: 500 })
  }
}
