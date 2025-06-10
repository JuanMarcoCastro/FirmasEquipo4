import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File

    if (!pdfFile) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 })
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    const pdfBase64 = pdfBuffer.toString("base64")

    const pythonScript = path.join(process.cwd(), "scripts", "digital_signature_manager.py")

    const pythonProcess = spawn("python3", [pythonScript, "--action", "verify", "--pdf_base64", pdfBase64])

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
            resolve(NextResponse.json(result))
          } catch (e) {
            resolve(
              NextResponse.json({ error: "Failed to parse Python script output.", details: output }, { status: 500 }),
            )
          }
        } else {
          resolve(
            NextResponse.json({ error: "Python script execution failed.", details: errorOutput }, { status: 500 }),
          )
        }
      })
    })
  } catch (error: any) {
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}
